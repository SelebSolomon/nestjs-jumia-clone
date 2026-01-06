import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RoleName } from '../enums/roles-enums';
import { Permission } from '../enums/permissions-enums';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({
    required: true,
    unique: true,
    enum: RoleName,
    default: RoleName.Customer,
  })
  name: RoleName;

  @Prop({ type: [String], enum: Permission, default: [Permission.BuyProduct] })
  permissions: Permission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
