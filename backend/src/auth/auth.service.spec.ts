import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedPassword123',
    role: 'user',
    lastUpdated: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
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
    usersRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
    };

    it('should successfully register a new user', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword123' as never);
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockResolvedValue(mockUser);
      usersRepository.findOneBy.mockResolvedValue(null);

      const result = await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: 'hashedPassword123',
        role: registerDto.role,
      });
      expect(usersRepository.save).toHaveBeenCalledWith(mockUser);
      // Result should not include password
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        lastUpdated: mockUser.lastUpdated,
      });
    });

    it('should hash the password before saving', async () => {
      const hashedPassword = 'hashedPassword123';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      usersRepository.create.mockReturnValue({ ...mockUser, password: hashedPassword });
      usersRepository.save.mockResolvedValue({ ...mockUser, password: hashedPassword });

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
      });
    });

    it('should throw an error if email already exists', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword123' as never);
      usersRepository.create.mockReturnValue(mockUser);
      usersRepository.save.mockRejectedValue(new Error('Duplicate email'));

      await expect(service.register(registerDto)).rejects.toThrow('Duplicate email');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      const token = 'jwt_token_123';
      usersRepository.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(token);

      const result = await service.login(loginDto);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ email: loginDto.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result).toEqual({ access_token: token });
    });

    it('should throw error with invalid email', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ email: loginDto.email });
    });

    it('should throw error with invalid password', async () => {
      usersRepository.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });

    it('should generate JWT token with correct payload', async () => {
      const token = 'jwt_token_123';
      usersRepository.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(token);

      await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        role: mockUser.role,
      });
    });

    it('should not expose password in token payload', async () => {
      const token = 'jwt_token_123';
      usersRepository.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      jwtService.sign.mockReturnValue(token);

      await service.login(loginDto);

      const signPayload = jwtService.sign.mock.calls[0][0];
      expect(signPayload).not.toHaveProperty('password');
      expect(signPayload).toHaveProperty('email');
      expect(signPayload).toHaveProperty('sub');
      expect(signPayload).toHaveProperty('role');
    });
  });
});
