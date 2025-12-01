import { User } from '../entities/user.entity';
import { Role } from '@prisma/client';

export type UserCreateData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isAdmin' | 'isOrganizer' | 'isUser'>;
export type UserUpdateData = Partial<{
  email: string;
  password: string;
  name: string;
  role: Role;
  refreshToken?: string | null;
}>;

export interface UserRepository {
  create(user: UserCreateData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, data: UserUpdateData): Promise<User>;
  delete(id: string): Promise<void>;
}

