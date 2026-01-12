import { IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../enums/payment-method-enum';
import { ShippingAddressDto } from './shipping-address-dto';

export class CreateOrderDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;
}
