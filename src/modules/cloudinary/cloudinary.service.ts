import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY_ROOT_FOLDER } from './cloudinary.config';

@Injectable()
export class CloudinaryService {
  uploadImage(
    file: Express.Multer.File,
    subFolder: string, // e.g., 'products', 'categories', 'users'
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${CLOUDINARY_ROOT_FOLDER}/${subFolder}`, // <-- All uploads go under nestjs-jumia
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
          if (error)
            return reject(new InternalServerErrorException(error.message));
          if (!result)
            return reject(
              new InternalServerErrorException(
                'Cloudinary upload failed: no result returned',
              ),
            );

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete image: ${error.message}`,
      );
    }
  }
}
