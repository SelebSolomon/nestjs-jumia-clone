import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { AuthorizationGuard } from '../auth/guards/authorization-guards';
import { Roles } from 'src/common/decorators/role.decorators';
import { RoleName } from '../roles/enums/roles-enums';
import { Request } from 'express';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { UpdateProductDto } from './dto/update-product.dto';
// import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private productService: ProductsService) {}

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin])
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 6 },
      ],
      multerOptions,
    ),
  )
  @Post()
  createProduct(
    @Body() createProductDto: CreateProductDto,
    @Req() req: Request & { user: { sub: string } },
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    if (!files?.thumbnail || files.thumbnail.length === 0) {
      throw new BadRequestException('Thumbnail image is required');
    }

    const thumbnailFile = files.thumbnail![0];
    const imagesFiles = files.images || [];

    // optional: log files for debugging
    console.log('Thumbnail:', thumbnailFile?.originalname);
    console.log(
      'Images:',
      imagesFiles.map((f) => f.originalname),
    );

    return this.productService.createProduct(
      createProductDto,
      req.user.sub,
      thumbnailFile,
      imagesFiles,
    );
  }

  @Get()
  allProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('fields') fields?: string,
    @Query('search') search?: string,
  ) {
    return this.productService.allProducts({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort,
      fields,
      search,
    });
  }

  @Get(':id')
  getSingleProduct(@Param('id') id: string) {
    return this.productService.getSingleProduct(id);
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 6 },
    ]),
  )
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin, RoleName.Seller])
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 6 },
      ],
      multerOptions,
    ),
  )
  @Patch(':id')
  updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.productService.updateProduct(
      id,
      updateProductDto,
      req.user.sub,
      files?.thumbnail?.[0],
      files?.images || [],
    );
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin, RoleName.Seller])
  @Delete(':id')
  deleteProduct(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.productService.deleteProduct(id, req.user.sub);
  }
}
