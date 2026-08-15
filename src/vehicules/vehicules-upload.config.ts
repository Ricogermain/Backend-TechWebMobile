import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';

/** Dossier racine (relatif à la racine du projet) où sont stockées les photos uploadées. */
export const VEHICULE_PHOTO_DIR = 'uploads/vehicules';

/** Taille maximale acceptée : 5 Mo. */
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

/** Formats d'image autorisés, associés à leur extension de fichier. */
const ALLOWED_MIME_TYPES: ReadonlyMap<string, string> = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

export const vehiculePhotoUploadOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), VEHICULE_PHOTO_DIR);
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME_TYPES.get(file.mimetype) ?? '.jpg';
      const name = `vehicule-${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: MAX_PHOTO_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new BadRequestException(
          'Format non accepté : seules les images JPEG, PNG, WebP ou GIF sont autorisées',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
};

/** Construit l'URL publique servie par le backend pour un fichier uploadé. */
export function buildPhotoUrl(filename: string): string {
  return `/${VEHICULE_PHOTO_DIR}/${filename}`;
}
