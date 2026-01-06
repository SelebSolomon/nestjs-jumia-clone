import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
// import { AuthenticationGuard } from './guards/authentication-guards';
import type { Request } from 'express';
import { UpdatePasswordDto } from './dto/update-password-dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { JwtAuthGuard } from './guards/jwt-guard';
// import { AuthorizationGuard } from './guards/authorization-guards';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: SignupDto) {
    return this.authService.register(registerDto);
  }

  @Patch('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: Request & { user: { sub: string } }) {
    return this.authService.logout(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: Request) {
    return {
      authenticated: true,
      user: request.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  updatePassword(
    @Body()
    updatePasswordDto: UpdatePasswordDto,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.authService.updatePassword(updatePasswordDto, req.user.sub);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgetPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgetPasswordDto.email);
  }
  @Patch('reset-password')
  resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, resetPasswordDto.newPassword);
  }

  @Post('refresh-token')
  refreshAccessToken(@Body() body: { refreshToken: string }) {
    return this.authService.refreshAccessToken(body.refreshToken);
  }
}
