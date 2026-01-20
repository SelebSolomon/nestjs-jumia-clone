// inbuild modules
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

// my imports
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/register-dto';
import error from 'src/config/error.config';
import { RolesService } from '../roles/role.service';
import {
  sendPasswordResetEmail,
  sendVerificationEmailAsync,
  sendWelcomeEmailHelper,
} from 'src/common/utils/sendMail';
import { generateVerificationToken } from 'src/common/utils/generateVerificationToken';

// librarys
import * as bcrypt from 'bcrypt';
// import { nanoid } from 'nanoid';
import { EmailsService } from '../emails/emails.service';
import { LoginDto } from './dto/login-dto';
import { signAccessToken, signRefreshToken } from 'src/common/utils/jwt-token';
import { UpdatePasswordDto } from './dto/update-password-dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private roleService: RolesService,
    private emailsService: EmailsService,
    private jwtService: JwtService,
    private logger: Logger,
  ) {}

  async register(registerDto: SignupDto) {
    const existingUser = await this.userService.findUserByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException(error.userAlreadyExists);
    }

    // Step 2: Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Step 3: Get default customer role
    const defaultRole = await this.roleService.getDefaultCustomerRole();

    const verificationToken = generateVerificationToken();

    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const expires = new Date(Date.now() + 15 * 60 * 1000);
    // Step 5: Create user with role
    const newUser = await this.userService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: defaultRole._id,
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: expires,
      emailVerified: false,
      isActive: true,
      phone: registerDto.phone,
    });

    // Step 6: Send verification email (async, non-blocking)
    await sendVerificationEmailAsync(
      this.emailsService,
      this.logger,
      newUser.email,
      verificationToken,
      newUser.name,
    );

    return {
      status: 'success',
      data: {
        newUser,
      },
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    // Hash the token from URL to match database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token
    const user = await this.userService.findByVerificationToken(hashedToken);

    if (!user) {
      throw new ConflictException('Invalid or expired verification token');
    }

    if (user.emailVerificationTokenExpires < new Date()) {
      throw new ConflictException('Verification token has expired');
    }

    if (user.emailVerified) {
      return {
        status: 'success',
        message: 'Email already verified',
      };
    }

    // Update user - mark email as verified and clear token
    await this.userService.update(user._id.toString(), {
      emailVerified: true,
      emailVerificationToken: undefined,
    });

    // Send welcome email
    await sendWelcomeEmailHelper(
      this.emailsService,
      this.logger,
      user.email,
      user.name,
    );

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Bad request');
    }
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      throw new ConflictException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Update user with new token
    await this.userService.update(user._id.toString(), {
      emailVerificationToken: hashedToken,
    });

    // Send email
    const result = await this.emailsService.sendVerificationEmail(
      'jumia API',
      user.email,
      verificationToken,
      user.name,
    );

    if (!result.success) {
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  }

  async login(loginDto: LoginDto) {
    const existingUser = await this.userService.findUserByEmailWithPassword(
      loginDto.email,
    );

    if (!existingUser) {
      throw new NotFoundException(error.invalidCredentials);
    }

    const isMatch = await bcrypt.compare(
      loginDto.password,
      existingUser.password,
    );

    if (!isMatch) {
      throw new NotFoundException(error.invalidCredentials);
    }

    console.log('hello world');
    if (!existingUser.isActive || !existingUser.emailVerified) {
      throw new BadRequestException(error.validationError);
    }

    // 1️⃣ Generate tokens
    const accessToken = await signAccessToken(
      this.jwtService,
      existingUser._id.toString(),
      existingUser.role.toString(),
    );

    const refreshToken = await signRefreshToken(
      this.jwtService,
      existingUser._id.toString(),
    );

    // 2️⃣ Hash refresh token (VERY IMPORTANT)
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    // 3️⃣ ROTATION: remove old refresh token, save new one
    await this.userService.update(existingUser._id.toString(), {
      refreshToken: hashedRefreshToken,
    });

    // 4️⃣ Return tokens
    return {
      success: true,
      accessToken,
      refreshToken,
    };
  }

  async logout(logginUser: string) {
    const user = await this.userService.findById(logginUser);

    if (!user) {
      throw new UnauthorizedException(error.unauthorized);
    }

    await this.userService.update(user._id.toString(), { refreshToken: '' });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async updatePassword(updatePasswordDto: UpdatePasswordDto, userId: string) {
    const user = await this.userService.findUserByIdWithPassword(userId);

    if (!user) {
      throw new UnauthorizedException(error.unauthorized);
    }

    const comparePassword = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      user.password,
    );
    console.log(user.password);

    if (!comparePassword) {
      throw new UnauthorizedException(error.passwordMismatch);
    }

    user.password = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    await user.save();

    return {
      message: 'Successfully updated Password',
    };
  }

  async forgotPassword(email: string) {
    const userEmail = await this.userService.findUserByEmail(email);

    if (userEmail) {
      const token = generateVerificationToken();
      const expiryDate = new Date();

      expiryDate.setHours(expiryDate.getHours() + 1);

      await this.userService.createForgotPasswordToken(
        userEmail._id.toString(),
        token,
        expiryDate,
      );

      await sendPasswordResetEmail(
        this.emailsService,
        this.logger,
        userEmail.email,
        token,
      );
    }

    return {
      message:
        'If an account exists with this email, a reset link has been sent.',
    };
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const user = await this.userService.findByPasswordResetToken(resetToken);

    if (!user) {
      throw new BadRequestException('Token is invalid or has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userService.updatePassword(user._id.toString(), hashedPassword);

    return {
      message: 'Password updated successfully',
    };
  }

  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    // 1️⃣ Verify the token (throws if invalid/expired)
    let decoded: { sub: string; type?: string };
    try {
      decoded = this.jwtService.verify<{ sub: string; type?: string }>(
        refreshToken,
        { secret: process.env.JWT_REFRESH_SECRET },
      );
    } catch (err) {
      this.logger.error(err.message);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2 Make sure it's actually a refresh token
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Not a refresh token');
    }

    const userId = decoded.sub;
    if (!userId) throw new UnauthorizedException('Invalid token payload');

    // 3 Find the user and include hashed refresh token
    const user = await this.userService.findByIdForRefreshToken(userId);
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Invalid refresh token');

    // 4 Compare token with hashed version in DB
    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isTokenValid)
      throw new UnauthorizedException('Refresh token does not match');

    // 5 Issue new tokens
    const accessToken = await signAccessToken(
      this.jwtService,
      user._id.toString(),
      user.role.toString(),
    );

    const newRefreshToken = await signRefreshToken(
      this.jwtService,
      user._id.toString(),
    );

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    await this.userService.updateRefreshToken(
      user._id.toString(),
      hashedRefreshToken,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }
}
