import { DynamoItem } from "../dynamo";

export interface User extends DynamoItem {
  PK: string;
  SK: string;
  Type: 'User';
  userId: string;
  cognitoId: string;
  name: string;
  email: string;
  role: 'GUEST' | 'USER' | 'ADMIN';
  approved: boolean;
  message?: string;
  avatar?: string;
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
  avatar?: string;
  approved?: boolean;
  role?: 'GUEST' | 'USER' | 'ADMIN';
  message?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    approved: boolean;
  };
}
