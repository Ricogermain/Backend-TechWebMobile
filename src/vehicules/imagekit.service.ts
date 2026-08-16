import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import ImageKit from 'imagekit';
import { VEHICULE_PHOTO_DIR } from './vehicules-upload.config';

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  filePath: string;
}

/**
 * Wrapper du SDK ImageKit : upload d'une photo (buffer en mémoire) et
 * suppression d'une photo existante. Les credentials proviennent de
 * l'environnement (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY,
 * IMAGEKIT_URL_ENDPOINT).
 */
@Injectable()
export class ImageKitService {
  private readonly logger = new Logger(ImageKitService.name);
  private readonly imagekit: ImageKit;

  constructor() {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      this.logger.warn(
        'Credentials ImageKit manquants (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT). ' +
          "L'upload des photos sera indisponible.",
      );
      this.imagekit = new ImageKit({
        publicKey: '',
        privateKey: '',
        urlEndpoint: '',
      });
      return;
    }

    this.imagekit = new ImageKit({ publicKey, privateKey, urlEndpoint });
  }

  get enabled(): boolean {
    return Boolean(
      process.env.IMAGEKIT_PUBLIC_KEY &&
        process.env.IMAGEKIT_PRIVATE_KEY &&
        process.env.IMAGEKIT_URL_ENDPOINT,
    );
  }

  /**
   * Upload un fichier reçu en mémoire (multer memoryStorage) vers ImageKit.
   * Retourne l'URL publique permanente du fichier.
   */
  async uploadPhoto(file: Express.Multer.File): Promise<ImageKitUploadResult> {
    if (!this.enabled) {
      throw new BadRequestException(
        'Stockage d\'images non configuré (variables IMAGEKIT_* manquantes)',
      );
    }

    const ext = this.extensionFor(file.mimetype) ?? '.jpg';
    const fileName = `vehicule-${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;

    const response = await this.imagekit.upload({
      file: file.buffer,
      fileName,
      folder: VEHICULE_PHOTO_DIR,
      useUniqueFileName: false,
      overwriteFile: false,
    });

    return {
      url: response.url,
      fileId: response.fileId,
      filePath: response.filePath,
    };
  }

  /**
   * Supprime un fichier ImageKit à partir de son URL publique.
   * Ignore silencieusement les URLs qui ne proviennent pas d'ImageKit
   * (data:, asset:, http externes...).
   */
  async deletePhotoByUrl(imageUrl?: string | null): Promise<void> {
    if (!imageUrl || !this.enabled) return;
    if (!imageUrl.includes('ik.imagekit.io')) return;

    try {
      // Le chemin du fichier dans la médiathèque, ex: /vehicules/xxx.jpg
      const match = imageUrl.match(/\/vehicules\/[^/?#]+\.(jpg|jpeg|png|webp|gif)/i);
      if (!match) return;

      const files = await this.imagekit.listFiles({
        path: VEHICULE_PHOTO_DIR,
        limit: 100,
      });

      const target = files.find(
        (f) => f.type === 'file' && f.filePath === match[0],
      );
      if (!target || target.type !== 'file') return;

      await this.imagekit.deleteFile(target.fileId);
      this.logger.log(`Photo supprimée d'ImageKit : ${target.filePath}`);
    } catch (error) {
      // Ne bloque jamais le flux principal si la suppression échoue.
      this.logger.warn(
        `Échec de la suppression ImageKit pour ${imageUrl}: ${(error as Error).message}`,
      );
    }
  }

  private extensionFor(mimetype: string): string | null {
    switch (mimetype) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      default:
        return null;
    }
  }
}
