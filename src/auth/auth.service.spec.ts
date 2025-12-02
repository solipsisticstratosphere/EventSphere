import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserUseCase } from "../modules/users/application/use-cases/create-user.use-case";
import { GetUserByEmailUseCase } from "../modules/users/application/use-cases/get-user-by-email.use-case";
import { GetUserUseCase } from "../modules/users/application/use-cases/get-user.use-case";
import { PrismaService } from "../prisma/prisma.service";
import { PasswordUtil } from "../shared/utils/password.util";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

jest.mock("../shared/utils/password.util");

describe("AuthService", () => {
  let service: AuthService;
  let createUserUseCase: CreateUserUseCase;
  let getUserByEmailUseCase: GetUserByEmailUseCase;
  let getUserUseCase: GetUserUseCase;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockCreateUserUseCase = {
    execute: jest.fn(),
  };

  const mockGetUserByEmailUseCase = {
    execute: jest.fn(),
  };

  const mockGetUserUseCase = {
    execute: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === "JWT_SECRET") return "test-secret";
      if (key === "JWT_REFRESH_SECRET") return "test-refresh-secret";
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        {
          provide: GetUserByEmailUseCase,
          useValue: mockGetUserByEmailUseCase,
        },
        {
          provide: GetUserUseCase,
          useValue: mockGetUserUseCase,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    createUserUseCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    getUserByEmailUseCase = module.get<GetUserByEmailUseCase>(
      GetUserByEmailUseCase
    );
    getUserUseCase = module.get<GetUserUseCase>(GetUserUseCase);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should successfully login with valid credentials", async () => {
      const loginDto: LoginDto = {
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
        name: "Test User",
        role: "USER",
        refreshToken: null,
      };

      const mockTokens = {
        access_token: "access-token",
        refresh_token: "refresh-token",
      };

      mockGetUserByEmailUseCase.execute.mockResolvedValue(mockUser);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.access_token)
        .mockResolvedValueOnce(mockTokens.refresh_token);
      (PasswordUtil.hash as jest.Mock).mockResolvedValue(
        "hashed-refresh-token"
      );
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
        ...mockTokens,
      });
      expect(mockGetUserByEmailUseCase.execute).toHaveBeenCalledWith(
        loginDto.email
      );
      expect(PasswordUtil.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it("should throw UnauthorizedException if user not found", async () => {
      const loginDto: LoginDto = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      mockGetUserByEmailUseCase.execute.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockGetUserByEmailUseCase.execute).toHaveBeenCalledWith(
        loginDto.email
      );
    });

    it("should throw UnauthorizedException if password is invalid", async () => {
      const loginDto: LoginDto = {
        email: "test@example.com",
        password: "wrong-password",
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
        name: "Test User",
        role: "USER",
      };

      mockGetUserByEmailUseCase.execute.mockResolvedValue(mockUser);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(PasswordUtil.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
    });
  });

  describe("validateUser", () => {
    it("should validate and return user by id", async () => {
      const userId = "user-123";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      };

      mockGetUserUseCase.execute.mockResolvedValue(mockUser);

      const result = await service.validateUser(userId);

      expect(result).toEqual(mockUser);
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(userId);
    });

    it("should return null if user not found", async () => {
      const userId = "non-existent-id";

      mockGetUserUseCase.execute.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(userId);
    });
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const registerDto: RegisterDto = {
        email: "newuser@example.com",
        password: "password123",
        name: "New User",
      };

      const mockUser = {
        id: "user-123",
        email: registerDto.email,
        name: registerDto.name,
        role: "USER",
        password: "hashed-password",
        refreshToken: null,
      };

      const mockTokens = {
        access_token: "access-token",
        refresh_token: "refresh-token",
      };

      (PasswordUtil.hash as jest.Mock)
        .mockResolvedValueOnce("hashed-password")
        .mockResolvedValueOnce("hashed-refresh-token");
      mockCreateUserUseCase.execute.mockResolvedValue(mockUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.access_token)
        .mockResolvedValueOnce(mockTokens.refresh_token);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
        ...mockTokens,
      });
      expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith({
        ...registerDto,
        password: "hashed-password",
      });
    });
  });

  describe("refresh", () => {
    it("should successfully refresh tokens", async () => {
      const userId = " user-123";
      const refreshToken = "refresh-token";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        role: "USER",
        refreshToken: "hashed-refresh-token",
      };

      const mockTokens = {
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      };

      mockGetUserUseCase.execute.mockResolvedValue(mockUser);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce(mockTokens.access_token)
        .mockResolvedValueOnce(mockTokens.refresh_token);
      (PasswordUtil.hash as jest.Mock).mockResolvedValue(
        "new-hashed-refresh-token"
      );
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.refresh(userId, refreshToken);

      expect(result).toEqual(mockTokens);
      expect(mockGetUserUseCase.execute).toHaveBeenCalledWith(userId);
      expect(PasswordUtil.compare).toHaveBeenCalledWith(
        refreshToken,
        mockUser.refreshToken
      );
    });

    it("should throw UnauthorizedException if user not found", async () => {
      const userId = " non-existent";
      const refreshToken = "refresh-token";

      mockGetUserUseCase.execute.mockResolvedValue(null);

      await expect(service.refresh(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it("should throw UnauthorizedException if refresh token does not match", async () => {
      const userId = " user-123";
      const refreshToken = "wrong-refresh-token";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        role: "USER",
        refreshToken: "hashed-refresh-token",
      };

      mockGetUserUseCase.execute.mockResolvedValue(mockUser);
      (PasswordUtil.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refresh(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe("logout", () => {
    it('should successfully logout user', async () => {
      const userId = ' user-123';

      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.logout(userId);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: null },
      });
    });
  });
});
