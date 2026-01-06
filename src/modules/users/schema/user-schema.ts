import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from 'src/modules/roles/schemas/role.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: Role.name, required: true })
  role: Types.ObjectId | Role;

  @Prop({ required: false })
  passwordResetToken?: string;

  @Prop({ required: false })
  passwordResetExpires?: Date;

  @Prop({ required: false })
  emailVerificationToken?: string;
  @Prop({ required: false })
  emailVerificationTokenExpires: Date;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ select: false, required: false })
  refreshToken?: string;

  @Prop({ type: [String], default: [] })
  address: string[];

  @Prop({ required: false })
  phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
