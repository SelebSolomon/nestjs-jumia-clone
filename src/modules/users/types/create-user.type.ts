import { Types } from 'mongoose';

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: Types.ObjectId;
  phone?: string;
  emailVerificationToken?: string;
  emailVerified?: boolean;
  isActive?: boolean;
};
