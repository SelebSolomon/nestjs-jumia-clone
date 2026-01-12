import { IsEnum, IsMongoId } from 'class-validator';
import { PaymentProvider } from '../enums/payment-provider';
import { PaymentMethod } from 'src/modules/orders/enums/payment-method-enum';

export class CreatePaymentDto {
  @IsMongoId()
  orderId: string;

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
