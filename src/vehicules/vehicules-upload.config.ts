import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

/** Dossier ImageKit où sont stockées les photos des véhicules. */
export const VEHICULE_PHOTO_DIR = 'vehicules';

/** Taille maximale acceptée : 5 Mo. */
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

/** Formats d'image autorisés, associés à leur extension de fichier. */
const ALLOWED_MIME_TYPES: ReadonlyMap<string, string> = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

/**
 * Options d'upload multer : le fichier est gardé en mémoire (buffer) puis
 * envoyé vers ImageKit par le service, au lieu d'être écrit sur le disque
 * éphémère de l'instance (perdu à chaque redémarrage sur Render).
 */
export const vehiculePhotoUploadOptions = {
  storage: memoryStorage(),
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
