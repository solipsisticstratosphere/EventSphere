import { Role } from '@prisma/client';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly role: Role = Role.USER,
    public readonly refreshToken?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static fromPrisma(data: any): User {
    return new User(
      data.id,
      data.email,
      data.password,
      data.name,
      data.role,
      data.refreshToken,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }

  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  isOrganizer(): boolean {
    return this.role === Role.ORGANIZER;
  }

  isUser(): boolean {
    return this.role === Role.USER;
  }
}




