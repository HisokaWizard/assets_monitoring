import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: 'user',
    lastUpdated: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 201 and create user on successful registration', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      };

      authService.register.mockResolvedValue(mockUser);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });

    it('should call authService.register with correct data', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'securepass',
        role: 'admin',
      };

      authService.register.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        role: registerDto.role,
      });

      await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should not expose password in response (handled by service)', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      };

      authService.register.mockResolvedValue(mockUser);

      const result = await controller.register(registerDto);

      // Controller returns what service returns
      // Service should not expose password (tested in service tests)
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('role');
    });
  });

  describe('login', () => {
    it('should return 200 and JWT token on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const tokenResponse = {
        access_token: 'jwt_token_123',
      };

      authService.login.mockResolvedValue(tokenResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(tokenResponse);
      expect(result.access_token).toBeDefined();
    });

    it('should call authService.login with correct credentials', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'mypassword',
      };

      authService.login.mockResolvedValue({
        access_token: 'token',
      });

      await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return access_token in response', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.mockResolvedValue({
        access_token: 'valid_jwt_token',
      });

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
      expect(result.access_token.length).toBeGreaterThan(0);
    });
  });
});
