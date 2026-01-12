import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schema/category.schema';
import { Model, Types } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  GetCategoriesParams,
  GetCategoryParams,
} from './interface/category-interface';
import { UpdateCategoryDto } from './dto/update-category.dto';

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

  async getCategories(params: GetCategoriesParams) {
    const { page = 1, limit = 20, sort, fields, search, parent } = params;

    // --- Build filter ---
    const filter: any = {};
    if (parent === 'null') filter.parent = null;
    else if (parent) filter.parent = parent;

    if (search) filter.name = { $regex: search, $options: 'i' };

    // --- Build sort ---
    let sortObj: any = {};
    if (sort) {
      sort.split(',').forEach((field) => {
        if (field.startsWith('-')) sortObj[field.substring(1)] = -1;
        else sortObj[field] = 1;
      });
    } else {
      sortObj = { createdAt: -1 }; // default
    }

    // --- Build projection (fields) ---
    const projection: any = {};
    if (fields) {
      fields.split(',').forEach((field) => (projection[field] = 1));
    }

    // --- Pagination ---
    const skip = (page - 1) * limit;

    // --- Count total results ---
    const totalResults = await this.categoryModel
      .countDocuments(filter)
      .populate('children');

    // --- Fetch data ---
    const categories = await this.categoryModel
      .find(filter, projection)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const response = categories.map((cat) => ({
      name: cat.name,
      description: cat.description,
      image: cat.image,
      _id: cat._id,
      parent: cat.parent,
      children: cat.children,
    }));

    // --- Build response ---
    const totalPages = Math.ceil(totalResults / limit);

    return {
      status: 'success',
      results: categories.length,
      pagination: {
        page,
        limit,
        totalPages,
        totalResults,
      },
      data: {
        response,
      },
    };
  }

  async getCategoryById(params: GetCategoryParams) {
    const { id, fields, includeChildren } = params;

    // --- Build projection ---
    const projection: any = {};
    if (fields) {
      fields.split(',').forEach((field) => (projection[field] = 1));
    }

    // --- Build query ---
    let query = this.categoryModel.findById(id, projection);

    // Populate parent if exists
    query = query.populate('parent', 'name slug');

    // Populate children if requested
    if (includeChildren) {
      query = query.populate('children', 'name slug image');
    }

    const category = await query.lean();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const response = {
      name: category.name,
      description: category.description,
      image: category.image,
      parent: category.parent,
      children: category.children,
    };

    return {
      status: 'success',
      data: {
        response,
      },
    };
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    console.log('hello world');
    if (!Types.ObjectId.isValid(id)) {
      this.logger.error('invalid mongoose id');
      throw new BadRequestException('invalid Id');
    }

    const category = await this.categoryModel.findById(id);

    if (!category) {
      this.logger.error('No category was found');
      throw new NotFoundException('Category not found');
    }

    const updates: any = {};
    if (updateCategoryDto.name) updates.name = updateCategoryDto.name;
    if (updateCategoryDto.description)
      updates.description = updateCategoryDto.description;
    if (updateCategoryDto.parent) updates.parent = updateCategoryDto.parent;

    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'categories',
        );

        if (category.imagePublicId) {
          await this.cloudinaryService.deleteImage(category.imagePublicId);
        }

        updates.image = uploadResult.url;
        updates.imagePublicId = uploadResult.publicId;
      } catch (error) {
        this.logger.error('Error uploading category image', error);
        throw new InternalServerErrorException('Image upload failed');
      }
    }

    category.set(updates);
    await category.save(); // this one will help the presave hook to update the slug becuase i am doing save here

    const response = {
      id: category._id,
      name: category.name,
      description: category.description,
      image: category.image,
      slug: category.slug,
      parent: category.parent,
    };

    return {
      status: 'success',
      data: {
        category: response,
      },
    };
  }

  async deleteCategory(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Mongodb ID');
    }

    const category = await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const children = await this.categoryModel.find({ parent: category._id });

    if (children.length > 0) {
      this.logger.error('category has subcategories, cannot delete it ');
      throw new ConflictException('Category has subcategories, cannot delete');
    }

    if (category.imagePublicId) {
      try {
        await this.cloudinaryService.deleteImage(category.imagePublicId);
      } catch (error) {
        this.logger.error(
          'Failed to delete category image from Cloudinary',
          error,
        );
      }
    }

    await this.categoryModel.findByIdAndDelete(id);

    return {
      status: 'success',
      message: 'Category deleted successfully',
      data: {
        categoryId: id,
      },
    };
  }
}
