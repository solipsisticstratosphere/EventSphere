import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../modules/users/domain/repositories/user.repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserUseCase } from '../modules/users/application/use-cases/create-user.use-case';
import { GetUserByEmailUseCase } from '../modules/users/application/use-cases/get-user-by-email.use-case';
import { GetUserUseCase } from '../modules/users/application/use-cases/get-user.use-case';
import { PasswordUtil } from '../shared/utils/password.util';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUserByEmailUseCase: GetUserByEmailUseCase,
    private getUserUseCase: GetUserUseCase,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await PasswordUtil.hash(registerDto.password);
    const user = await this.createUserUseCase.execute({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    const { password, refreshToken, ...result } = user;
    return {
      user: result,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.getUserByEmailUseCase.execute(loginDto.email);
      
      const isPasswordValid = await PasswordUtil.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refresh_token);

      const { password, refreshToken, ...result } = user;
      return {
        user: result,
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.getUserUseCase.execute(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshTokenMatches = await PasswordUtil.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(userId: string, email: string, role: any) {
    const payload = { sub: userId, email, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await PasswordUtil.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async validateUser(userId: string) {
    return this.getUserUseCase.execute(userId);
  }
}
