import { DynamoItem } from '../dynamo';

export interface UserAvatar {
  key: string;
  url: string;
  size?: number;
  contentType?: string;
}

export interface User extends DynamoItem {
  PK: string;
  SK: string;
  Type: 'User';
  userId: string;
  cognitoId?: string;
  name: string;
  email: string;
  role: 'GUEST' | 'USER' | 'ADMIN';
  approved: boolean;
  message?: string;
  password?: string;
  registrationToken?: string;
  avatar?: UserAvatar;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  message: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  avatarKey?: string;
  approved?: boolean;
  role?: 'GUEST' | 'USER' | 'ADMIN';
  message?: string;
  registrationToken?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
