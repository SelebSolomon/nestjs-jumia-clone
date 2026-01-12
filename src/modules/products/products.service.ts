import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ProductsQuery } from './interface/products-query';
import { UpdateProductDto } from './dto/update-product.dto';
// import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  logger = new Logger(ProductsService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private userservice: UsersService,
    private cloudinaryService: CloudinaryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getProductsByIds(ids: string[]) {
    return this.productModel
      .find({ _id: { $in: ids } })
      .select('price stock name'); // only return fields needed
  }

  async getProductById(id: string) {
    return this.productModel.findById(id);
  }

  async increaseStock(productId: string | Types.ObjectId, quantity: number) {
    const result = await this.productModel.findOneAndUpdate(
      { _id: productId, isActive: true },
      { $inc: { stock: quantity } },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException('Product not found or inactive');
    }

    return result;
  }

  async createProduct(
    createProductDto: CreateProductDto,
    userId: string,
    thumbnailFile: Express.Multer.File,
    imagesFiles: Express.Multer.File[] = [],
  ) {
    // 1 Check admin
    const isAdmin = await this.userservice.isAdmin(userId);
    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can perform this action');
    }

    //  Upload thumbnail
    if (!thumbnailFile) {
      throw new BadRequestException('Thumbnail image is required');
    }

    let thumbnailUpload: { url: string; publicId: string };
    try {
      const result = await this.cloudinaryService.uploadImage(
        thumbnailFile,
        'products',
      );
      if (!result?.url || !result?.publicId) {
        throw new InternalServerErrorException('Thumbnail upload failed');
      }
      thumbnailUpload = result;
    } catch (err) {
      this.logger.error('Error uploading thumbnail', err.message || err);
      throw new InternalServerErrorException('Thumbnail upload failed');
    }

    //  Upload additional images
    const imagesUrls: string[] = [];
    const imagesPublicIds: string[] = [];

    for (const file of imagesFiles) {
      try {
        const uploaded = await this.cloudinaryService.uploadImage(
          file,
          'products',
        );
        if (!uploaded?.url || !uploaded?.publicId) {
          this.logger.warn('Skipped invalid image upload', uploaded);
          continue;
        }
        imagesUrls.push(uploaded.url);
        imagesPublicIds.push(uploaded.publicId);
      } catch (err) {
        this.logger.warn('Error uploading product image', err.message || err);
      }
    }

    if (
      !createProductDto.category ||
      !Types.ObjectId.isValid(createProductDto.category)
    ) {
      throw new BadRequestException('Valid category ID is required');
    }

    //  Build product data
    const productData = {
      name: createProductDto.name,
      price: createProductDto.price,
      description: createProductDto.description,
      stock: createProductDto.stock,
      category: createProductDto.category,
      thumbnail: thumbnailUpload.url,
      thumbnailPublicId: thumbnailUpload.publicId,
      images: imagesUrls.length ? imagesUrls : [thumbnailUpload.url],
      imagePublicIds: imagesPublicIds.length
        ? imagesPublicIds
        : [thumbnailUpload.publicId],
    };

    //  Save to DB
    try {
      const product = new this.productModel(productData);
      await product.save();
      await this.cacheManager.del('products:all');

      return {
        status: 'success',
        data: {
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            description: product.description,
            stock: product.stock,
            category: product.category,
            thumbnail: product.thumbnail,
            thumbnailPublicId: product.thumbnailPublicId,
            images: product.images,
            imagePublicIds: product.imagePublicIds,
          },
        },
      };
    } catch (err) {
      this.logger.error('Error saving product', err.message || err);
      // Cleanup uploaded files
      await this.cloudinaryService.deleteImage(thumbnailUpload.publicId);
      for (const id of imagesPublicIds) {
        await this.cloudinaryService.deleteImage(id);
      }
      throw new InternalServerErrorException('Product creation failed');
    }
  }

  async allProducts(query: ProductsQuery) {
    const { page = 1, limit = 20, sort, fields, search } = query;

    const cacheKey = `products:all:${page}:${limit}:${sort}:${fields}:${search}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('🔥 FROM CACHE');
      return cached;
    }

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortObj: any = {};
    if (sort) {
      sort.split(',').forEach((field) => {
        if (field.startsWith('-')) sortObj[field.slice(1)] = -1;
        else sortObj[field] = 1;
      });
    } else {
      sortObj.createdAt = -1;
    }

    const projection: any = {};
    if (fields) {
      fields.split(',').forEach((field) => (projection[field] = 1));
    }

    const skip = (page - 1) * limit;

    const totalResults = await this.productModel.countDocuments(filter);

    const products = await this.productModel
      .find({ ...filter, isActive: true }, projection)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.ceil(totalResults / limit);

    const response = products.map((prod: any) => ({
      id: prod._id,
      name: prod.name,
      price: prod.price,
      description: prod.description,
      stock: prod.stock,
      thumbnail: prod.thumbnail,
      image: prod.images?.[0],
      inStock: prod.inStock,
    }));

    const result = {
      status: 'success',
      result: response.length,
      pagination: {
        page,
        limit,
        totalPages,
        totalResults,
      },
      data: {
        products: response,
      },
    };

    await this.cacheManager.set(cacheKey, result, 60);

    return result;
  }

  async getSingleProduct(id: string) {
    // 1️⃣ Validate Mongo ID
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const cacheKey = `products:single:${id}`;

    // 2️⃣ Check cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Product ${id} fetched from cache`);
      return cached;
    }

    // 3️⃣ Fetch from DB
    const product = await this.productModel
      .findOne({ _id: id, isActive: true })
      .populate('category', 'name')
      .lean();

    if (!product) {
      throw new NotFoundException(`No product found with id ${id}`);
    }

    // 4️⃣ Shape response
    const result = {
      status: 'success',
      data: {
        product: {
          id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          stock: product.stock,
          inStock: product.inStock,
          thumbnail: product.thumbnail,
          images: product.images,
          category: product.category,
        },
      },
    };

    // 5️⃣ Save to cache (TTL REQUIRED)
    await this.cacheManager.set(cacheKey, result, 60); // 60 seconds

    return result;
  }

  async updateProduct(
    productId: string,
    updateDto: UpdateProductDto,
    userId: string,
    thumbnailFile?: Express.Multer.File,
    imagesFiles: Express.Multer.File[] = [],
  ) {
    // Validate ID
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }
    const isAdmin = await this.userservice.isAdmin(userId);

    if (!isAdmin) {
      throw new UnauthorizedException('Only admins can perform this action');
    }
    // Fetch product
    const product = await this.productModel.findOne({
      _id: productId,
      isActive: true,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update primitive fields (safe merge)
    const allowedFields = ['name', 'price', 'description', 'stock', 'category'];

    allowedFields.forEach((field) => {
      if (
        updateDto[field] !== undefined &&
        updateDto[field] !== null &&
        updateDto[field] !== ''
      ) {
        product[field] = updateDto[field];
      }
    });

    //  Replace thumbnail (optional)
    if (thumbnailFile) {
      const uploaded = await this.cloudinaryService.uploadImage(
        thumbnailFile,
        'products',
      );

      if (product.thumbnailPublicId) {
        await this.cloudinaryService.deleteImage(product.thumbnailPublicId);
      }

      product.thumbnail = uploaded.url;
      product.thumbnailPublicId = uploaded.publicId;
    }

    // Add new images (optional)
    if (imagesFiles.length > 0) {
      for (const file of imagesFiles) {
        const uploaded = await this.cloudinaryService.uploadImage(
          file,
          'products',
        );
        product.images.push(uploaded.url);
        product.imagePublicIds.push(uploaded.publicId);
      }
    }

    // Save
    await product.save();

    //  Cache invalidation
    await this.cacheManager.del('products:all');
    await this.cacheManager.del(`products:single:${productId}`);

    //Response
    return {
      status: 'success',
      data: {
        product: {
          id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          stock: product.stock,
          inStock: product.inStock,
          thumbnail: product.thumbnail,
          images: product.images,
          category: product.category,
        },
      },
    };
  }

  async deleteProduct(productId: string, userId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product ID');
    }

    const isAdmin = await this.userservice.isAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    const product = await this.productModel.findOne({
      _id: productId,
      isActive: true,
    });
    if (!product) {
      this.logger.error(`No product found with id ${productId}`);
      throw new NotFoundException(`No product found with id ${productId}`);
    }

    // 🔹 Delete assets (non-blocking safety)
    try {
      if (product.thumbnailPublicId) {
        await this.cloudinaryService.deleteImage(product.thumbnailPublicId);
      }

      if (product.imagePublicIds?.length) {
        await Promise.all(
          product.imagePublicIds.map((publicId) =>
            this.cloudinaryService.deleteImage(publicId),
          ),
        );
      }
    } catch (error) {
      this.logger.error(
        `Cloudinary cleanup failed for product ${productId}`,
        error,
      );
      // intentionally NOT throwing
    }

    // 🔹 Delete product from DB
    await this.productModel.findByIdAndDelete(productId);

    // 🔹 Cache invalidation
    await this.cacheManager.del('products:all');
    await this.cacheManager.del(`products:single:${productId}`);

    return {
      status: 'success',
      message: 'Successfully deleted',
    };
  }
}
