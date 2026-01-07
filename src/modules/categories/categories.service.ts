import {
  Injectable,
  Logger,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schema/category.schema';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  constructor(
    private userservice: UsersService,
    private cloudinaryService: CloudinaryService,

    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async createCategory(
    createCategoryDto: CreateCategoryDto,
    adminId: string,
    file: Express.Multer.File,
  ) {
    const isAdmin = await this.userservice.isAdmin(adminId);
    if (!isAdmin) throw new UnauthorizedException('Not authorized');

    const uploadImage = await this.cloudinaryService.uploadImage(
      file,
      'categories',
    );

    try {
      const category = await this.categoryModel.create({
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        image: uploadImage.url,
        imagePublicId: uploadImage.publicId,
        parent: createCategoryDto.parent,
      });

      return {
        status: 'success',
        data: {
          category: {
            name: category.name,
            description: category?.description,
            image: category?.image,
            parent: category?.parent,
          },
        },
      };
    } catch (err) {
      this.logger.error('error while uploading a categories');
      await this.cloudinaryService.deleteImage(uploadImage.publicId);
      throw err;
    }
  }
}
