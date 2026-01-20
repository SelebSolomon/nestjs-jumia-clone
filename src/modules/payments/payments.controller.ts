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
  Logger,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  logger = new Logger(PaymentsController.name);
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  pay(
    @Body() paymentDto: CreatePaymentDto,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.paymentsService.pay(req.user.sub, paymentDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  paymentStatus(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.paymentsService.paymentStatus(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/refund')
  refund(
    @Param('id') id: string,
    @Req() req: Request & { user: { sub: string } },
  ) {
    return this.paymentsService.refund(req.user.sub, id);
  }

  // ✅ TEST ENDPOINT - Add this first to verify routing works
  @Get('webhook/test')
  testWebhook() {
    this.logger.log('✅ Webhook test endpoint reached!');
    return {
      success: true,
      message: 'Webhook endpoint is configured correctly',
      timestamp: new Date().toISOString(),
    };
  }

  // ✅ ACTUAL WEBHOOK - NO AUTH GUARD!
  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    this.logger.log('🎯 Webhook POST request received');
    this.logger.log(`Signature present: ${!!signature}`);
    this.logger.log(`Body type: ${typeof req.body}`);
    this.logger.log(`Is Buffer: ${Buffer.isBuffer(req.body)}`);

    // Get raw body
    if (!Buffer.isBuffer(req.body)) {
      throw new BadRequestException('Expected raw body as Buffer');
    }

    return this.paymentsService.handleStripeWebhook(req.body, signature);
  }
}
