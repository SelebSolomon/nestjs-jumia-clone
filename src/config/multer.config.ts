import * as multer from 'multer';
import { Options } from 'multer';

export const multerOptions: Options = {
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      return cb(
        new Error('Only jpg, jpeg, png, webp images are allowed') as any,
        false,
      );
    }
    cb(null, true);
  },
};
