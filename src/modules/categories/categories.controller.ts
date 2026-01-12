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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Permissions, Roles } from 'src/common/decorators/role.decorators';
import { RoleName } from '../roles/enums/roles-enums';
import { Permission } from '../roles/enums/permissions-enums';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { AuthorizationGuard } from '../auth/guards/authorization-guards';
import mongoose from 'mongoose';
import { UpdateCategoryDto } from './dto/update-category.dto';
// import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private categoryService: CategoriesService) {}

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin])
  @Permissions([Permission.CreateProduct])
  @Post()
  @UseInterceptors(FileInterceptor('image', multerOptions))
  async createCategory(
    @Req() req: Request & { user: { sub: string } },
    @Body() createCatgory: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.categoryService.createCategory(
      createCatgory,
      req.user.sub,
      file,
    );
  }

  @Get()
  async getAllCategories(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('fields') fields?: string,
    @Query('search') search?: string,
    @Query('parent') parent?: string,
  ) {
    return this.categoryService.getCategories({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      sort,
      fields,
      search,
      parent,
    });
  }

  @Get(':id')
  async getCategory(
    @Param('id') id: string,
    @Query('fields') fields?: string,
    @Query('includeChildren') includeChildren?: string,
  ) {
    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid category ID');
    }

    return this.categoryService.getCategoryById({
      id,
      fields,
      includeChildren: includeChildren === 'true',
    });
  }
  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin])
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Patch(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body()
    updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.categoryService.updateCategory(id, updateCategoryDto, file);
  }

  @UseGuards(JwtAuthGuard, AuthorizationGuard)
  @Roles([RoleName.Admin])
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
