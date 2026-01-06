import { EmailsService } from 'src/modules/emails/emails.service';
import { Logger } from '@nestjs/common';

/**
 * Send verification email without blocking registration
 */
export const sendVerificationEmailAsync = async (
  emailsService: EmailsService,
  logger: Logger,
  email: string,
  token: string,
  name: string,
): Promise<void> => {
  try {
    const result = await emailsService.sendVerificationEmail(
      'jumia API',
      email,
      token,
      name,
    );

    if (result.success) {
      logger.log(`Verification email sent to ${email}`);
    } else {
      logger.error(
        `Failed to send verification email to ${email}: ${result.error}`,
      );
    }
  } catch (error) {
    logger.error(
      `Error sending verification email to ${email}:`,
      error.message,
    );
    // Don't throw - registration should succeed even if email fails
  }
};

/**
 * Send welcome email after verification
 */
export const sendWelcomeEmailHelper = async (
  emailsService: EmailsService,
  logger: Logger,
  email: string,
  name: string,
): Promise<void> => {
  try {
    const result = await emailsService.sendWelcomeEmail(email, name);

    if (result.success) {
      logger.log(`Welcome email sent to ${email}`);
    } else {
      logger.error(`Failed to send welcome email to ${email}: ${result.error}`);
    }
  } catch (error: any) {
    logger.error(`Error sending welcome email to ${email}:`, error.message);
  }
};

export const sendPasswordResetEmail = async (
  emailsService: EmailsService,
  logger: Logger,
  email: string,
  token: string,
): Promise<void> => {
  try {
    console.log('entered');

    const result = await emailsService.sendPasswordResetEmail(email, token);
    console.log('entered');

    if (result.success) {
      logger.log(`Password reset email sent to ${email}`);
    } else {
      logger.error(
        `Failed to send password reset email to ${email}: ${result.error}`,
      );
    }
  } catch (error: any) {
    logger.error(
      `Error sending password reset email to ${email}:`,
      error.message,
    );
  }
};
