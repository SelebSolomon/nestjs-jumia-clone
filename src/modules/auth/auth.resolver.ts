import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/register-dto';
import { LoginDto } from './dto/login-dto';
// import { AuthenticationGuard } from './guards/authentication-guards';
import type { Request } from 'express';
import { UpdatePasswordDto } from './dto/update-password-dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { JwtAuthGuard } from './guards/jwt-guard';
import { Req, UseGuards } from '@nestjs/common';
import { RegisterGraphqlQlType } from './graphql-auth-types/register-graphql-types';
import { SignupInput } from './graphql-auth-inputs/register-graphql-input';
import { RegisterResponseType } from './auth-response/register-reponse';
import { ResendEmailToken } from './dto/resend-email-token';
import { VerifyEmailResponseType } from './auth-response/verify-email-response';
// import { AuthorizationGuard } from './guards/authorization-guards';

@Resolver('auth')
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => RegisterResponseType)
  async register(@Args('input') input: SignupInput) {
    const result = await this.authService.register(input);

    return {
      status: result.status,
      data: {
        id: result.data.newUser._id,
        name: result.data.newUser.name,
        email: result.data.newUser.email,
        role: result.data.newUser.role,
        address: result.data.newUser.address,
        phone: result.data.newUser.phone,
      },
    };
  }

  @Mutation(() => Boolean)
  async resendVerificationEmail(@Args('email') email: string) {
    await this.authService.resendVerificationEmail(email);

    return true;
  }

  @Mutation(() => VerifyEmailResponseType)
  async verifyEmail(@Args('token') token: string) {
    const result = await this.authService.verifyEmail(token);

    return {
      status: result.success,
      data: {
        message: result.message,
      },
    };
  }

  /*
  @Mutation('login')
  async login(@Args() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation('logout')
  logout(@Req() req: Request & { user: { sub: string } }) {
    return this.authService.logout(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Query('me')
  me(@Req() request: Request) {
    return {
      authenticated: true,
      user: request.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation('update-password')
  updatePassword(
    @Args()
    updatePasswordDto: UpdatePasswordDto,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.authService.updatePassword(updatePasswordDto, req.user.sub);
  }

  @Mutation('forgot-password')
  forgotPassword(@Args() forgetPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgetPasswordDto.email);
  }
  @Mutation('reset-password')
  resetPassword(
    @Args('token') token: string,
    @Args() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, resetPasswordDto.newPassword);
  }

  @Mutation('refresh-token')
  refreshAccessToken(@Args() body: { refreshToken: string }) {
    return this.authService.refreshAccessToken(body.refreshToken);
  }
    */
}
