import { IsEnum } from 'class-validator';
import { ShippingStatus } from '../enums/shipping-status-enum';

export class UpdateShippingStatusDto {
  @IsEnum(ShippingStatus)
  shippingStatus: ShippingStatus;
}
