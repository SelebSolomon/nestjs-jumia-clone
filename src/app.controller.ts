import {
  BadRequestException,
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import error from './config/error.config';
// import { AuthenticationGuard } from './modules/auth/guards/authentication-guards';
import { AuthorizationGuard } from './modules/auth/guards/authorization-guards';
import { Permissions } from './common/decorators/role.decorators';
import { Permission } from './modules/roles/enums/permissions-enums';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  // @UseGuards(AuthenticationGuard, AuthorizationGuard)

  // @Permissions([Permission.BuyProduct])
  @Get()
  getHello(): string {
    // throw new BadRequestException(error.validationError);
    return this.appService.getHello();
  }
}
