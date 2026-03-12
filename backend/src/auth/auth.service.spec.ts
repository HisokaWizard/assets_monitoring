import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { User } from "./user.entity";
import { UserRole } from "./user-role.enum";
import { UserRepository } from "./user.repository";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 1,
    email: "test@example.com",
    password: "hashedPassword123",
    role: UserRole.USER,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastUpdated: new Date("2025-01-01"),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findOneById: jest.fn(),
            findOneByEmail: jest.fn(),
            createAndSave: jest.fn(),
            updateAllRoles: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getMe", () => {
    it("should call userRepository.findOneById", async () => {
      // Arrange
      userRepository.findOneById.mockResolvedValue(mockUser);

      // Act
      await service.getMe(1);

      // Assert
      expect(userRepository.findOneById).toHaveBeenCalledWith(1);
      expect(userRepository.findOneById).toHaveBeenCalledTimes(1);
    });

    it("should throw UnauthorizedException when user not found", async () => {
      // Arrange
      userRepository.findOneById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getMe(999)).rejects.toThrow("User not found");
    });

    it("should return user without password", async () => {
      // Arrange
      userRepository.findOneById.mockResolvedValue(mockUser);

      // Act
      const result = await service.getMe(1);

      // Assert
      expect(result).not.toHaveProperty("password");
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        lastUpdated: mockUser.lastUpdated,
      });
    });
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      email: "test@example.com",
      password: "password123",
    };

    it("should call userRepository.findOneByEmail to check existing", async () => {
      // Arrange
      jest
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("hashedPassword123" as never);
      userRepository.findOneByEmail.mockResolvedValue(null);
      userRepository.createAndSave.mockResolvedValue(mockUser);

      // Act
      await service.register(registerDto);

      // Assert
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(userRepository.findOneByEmail).toHaveBeenCalledTimes(1);
    });

    it("should call userRepository.createAndSave with hashed password", async () => {
      // Arrange
      const hashedPassword = "hashedPassword123";
      jest.spyOn(bcrypt, "hash").mockResolvedValue(hashedPassword as never);
      userRepository.findOneByEmail.mockResolvedValue(null);
      userRepository.createAndSave.mockResolvedValue(mockUser);

      // Act
      await service.register(registerDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.createAndSave).toHaveBeenCalledWith({
        email: registerDto.email,
        password: hashedPassword,
        role: UserRole.USER,
      });
    });

    it("should throw BadRequestException when email already exists", async () => {
      // Arrange
      userRepository.findOneByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        "User with this email already exists",
      );
    });

    it("should always assign UserRole.USER", async () => {
      // Arrange
      jest
        .spyOn(bcrypt, "hash")
        .mockResolvedValue("hashedPassword123" as never);
      userRepository.findOneByEmail.mockResolvedValue(null);
      userRepository.createAndSave.mockResolvedValue(mockUser);

      // Act
      await service.register(registerDto);

      // Assert
      expect(userRepository.createAndSave).toHaveBeenCalledWith(
        expect.objectContaining({ role: UserRole.USER }),
      );
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "password123",
    };

    it("should call userRepository.findOneByEmail", async () => {
      // Arrange
      userRepository.findOneByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue("jwt_token_123");

      // Act
      await service.login(loginDto);

      // Assert
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(userRepository.findOneByEmail).toHaveBeenCalledTimes(1);
    });

    it("should return access_token on valid credentials", async () => {
      // Arrange
      const token = "jwt_token_123";
      userRepository.findOneByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(result).toEqual({ access_token: token });
    });

    it("should throw UnauthorizedException on invalid credentials (wrong email)", async () => {
      // Arrange
      userRepository.findOneByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        "Invalid credentials",
      );
      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
    });

    it("should throw UnauthorizedException on invalid credentials (wrong password)", async () => {
      // Arrange
      userRepository.findOneByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        "Invalid credentials",
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it("should generate JWT token with correct payload", async () => {
      // Arrange
      const token = "jwt_token_123";
      userRepository.findOneByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(token);

      // Act
      await service.login(loginDto);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });

    it("should not expose password in token payload", async () => {
      // Arrange
      const token = "jwt_token_123";
      userRepository.findOneByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(token);

      // Act
      await service.login(loginDto);

      // Assert
      const signPayload = jwtService.sign.mock.calls[0][0];
      expect(signPayload).not.toHaveProperty("password");
      expect(signPayload).toHaveProperty("email");
      expect(signPayload).toHaveProperty("sub");
      expect(signPayload).toHaveProperty("role");
    });
  });

  describe("resetAllUserRoles", () => {
    it("should call userRepository.updateAllRoles", async () => {
      // Arrange
      userRepository.updateAllRoles.mockResolvedValue(5);

      // Act
      await service.resetAllUserRoles();

      // Assert
      expect(userRepository.updateAllRoles).toHaveBeenCalledWith(UserRole.USER);
      expect(userRepository.updateAllRoles).toHaveBeenCalledTimes(1);
    });

    it("should return count of updated users", async () => {
      // Arrange
      userRepository.updateAllRoles.mockResolvedValue(10);

      // Act
      const result = await service.resetAllUserRoles();

      // Assert
      expect(result).toEqual({ updated: 10 });
    });
  });
});
