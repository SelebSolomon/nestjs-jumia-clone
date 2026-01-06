// src/modules/emails/emails.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailContents } from './email-templates/email-contents';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailsService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailsService.name);
  private readonly fromEmail: string;
  private readonly appUrl: string;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    this.fromEmail = this.configService.get<string>(
      'SMTP_FROM',
      'Jumai API <noreply@jumai.com>',
    );
    this.appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );

    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'nakia.jacobs5@ethereal.email',
        pass: 'FttmnqCDSpu5STBTdj',
      },
    });
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('✓ SMTP connection verified successfully');
    } catch (error) {
      this.logger.error('✗ SMTP connection failed:', error.message);
    }
  }

  async sendMail(options: EmailOptions): Promise<EmailResult> {
    try {
      const mailOptions = {
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully to ${options.to}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}:`,
        error.message,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Password Reset
  async sendPasswordResetEmail(
    to: string,
    token: string,
  ): Promise<EmailResult> {
    const resetLink = `${this.appUrl}/reset-password?token=${token}`;

    return await this.sendMail({
      from: 'jumia API',
      to,
      subject: 'Password Reset Request',
      html: EmailContents.passwordReset(resetLink),
    });
  }

  // Email Verification
  async sendVerificationEmail(
    from: 'jumia API',
    to: string,
    token: string,
    name: string,
  ): Promise<EmailResult> {
    const verificationLink = `${this.appUrl}/verify-email?token=${token}`;

    return await this.sendMail({
      to,
      subject: 'Verify Your Email Address',
      html: EmailContents.emailVerification(verificationLink, name),
    });
  }

  // Welcome Email
  async sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
    return await this.sendMail({
      to,
      subject: 'Welcome to Jumai API!',
      html: EmailContents.welcome(name),
    });
  }

  // Order Confirmation
  async sendOrderConfirmationEmail(
    to: string,
    orderDetails: { orderId: string; totalAmount: number; items: any[] },
  ): Promise<EmailResult> {
    return await this.sendMail({
      to,
      subject: `Order Confirmation - #${orderDetails.orderId}`,
      html: EmailContents.orderConfirmation(orderDetails),
    });
  }

  // Account Activated
  async sendAccountActivatedEmail(
    to: string,
    name: string,
  ): Promise<EmailResult> {
    return await this.sendMail({
      to,
      subject: 'Account Activated Successfully',
      html: EmailContents.accountActivated(name),
    });
  }

  // Password Changed
  async sendPasswordChangedEmail(
    to: string,
    name: string,
  ): Promise<EmailResult> {
    return await this.sendMail({
      to,
      subject: 'Password Changed Successfully',
      html: EmailContents.passwordChanged(name),
    });
  }

  // 2FA Code
  async sendTwoFactorCodeEmail(
    to: string,
    code: string,
    name: string,
  ): Promise<EmailResult> {
    return await this.sendMail({
      to,
      subject: 'Your Verification Code',
      html: EmailContents.twoFactorCode(code, name),
    });
  }

  // Newsletter Subscription
  async sendNewsletterSubscriptionEmail(
    to: string,
    name: string,
    unsubscribeToken: string,
  ): Promise<EmailResult> {
    const unsubscribeLink = `${this.appUrl}/unsubscribe?token=${unsubscribeToken}`;

    return await this.sendMail({
      to,
      subject: 'Newsletter Subscription Confirmed',
      html: EmailContents.newsletterSubscription(name, unsubscribeLink),
    });
  }
}
