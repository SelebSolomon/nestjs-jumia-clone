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

}
