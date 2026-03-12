import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserRepository } from "./user.repository";
import { User } from "./user.entity";
import { UserRole } from "./user-role.enum";

describe("UserRepository", () => {
  let userRepository: UserRepository;
  let typeormRepository: jest.Mocked<Repository<User>>;

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
    const mockTypeormRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useValue: mockTypeormRepository,
        },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    typeormRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findOneById", () => {
    it("should return user when found by id", async () => {
      // Arrange
      typeormRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findOneById(1);

      // Assert
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by id", async () => {
      // Arrange
      typeormRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.findOneById(999);

      // Assert
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });
  });

  describe("findOneByEmail", () => {
    it("should return user when found by email", async () => {
      // Arrange
      typeormRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findOneByEmail("test@example.com");

      // Assert
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should return null when user not found by email", async () => {
      // Arrange
      typeormRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await userRepository.findOneByEmail(
        "nonexistent@example.com",
      );

      // Assert
      expect(typeormRepository.findOne).toHaveBeenCalledWith({
        where: { email: "nonexistent@example.com" },
      });
      expect(result).toBeNull();
    });
  });

  describe("createAndSave", () => {
    it("should create and save a new user", async () => {
      // Arrange
      const userData: Partial<User> = {
        email: "new@example.com",
        password: "hashedPassword",
        role: UserRole.USER,
      };
      const createdUser = { ...mockUser, ...userData };
      typeormRepository.create.mockReturnValue(createdUser as User);
      typeormRepository.save.mockResolvedValue(createdUser as User);

      // Act
      await userRepository.createAndSave(userData);

      // Assert
      expect(typeormRepository.create).toHaveBeenCalledWith(userData);
      expect(typeormRepository.save).toHaveBeenCalledWith(createdUser);
    });

    it("should return the saved user entity", async () => {
      // Arrange
      const userData: Partial<User> = {
        email: "new@example.com",
        password: "hashedPassword",
        role: UserRole.USER,
      };
      const savedUser: User = {
        ...mockUser,
        id: 2,
        email: "new@example.com",
        password: "hashedPassword",
      };
      typeormRepository.create.mockReturnValue(savedUser);
      typeormRepository.save.mockResolvedValue(savedUser);

      // Act
      const result = await userRepository.createAndSave(userData);

      // Assert
      expect(result).toEqual(savedUser);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("email", "new@example.com");
    });
  });

  describe("updateAllRoles", () => {
    it("should update all users to the specified role", async () => {
      // Arrange
      typeormRepository.update.mockResolvedValue({
        affected: 5,
        raw: [],
        generatedMaps: [],
      });

      // Act
      await userRepository.updateAllRoles(UserRole.USER);

      // Assert
      expect(typeormRepository.update).toHaveBeenCalledWith(
        {},
        { role: UserRole.USER },
      );
    });

    it("should return the number of affected rows", async () => {
      // Arrange
      typeormRepository.update.mockResolvedValue({
        affected: 10,
        raw: [],
        generatedMaps: [],
      });

      // Act
      const result = await userRepository.updateAllRoles(UserRole.ADMIN);

      // Assert
      expect(result).toBe(10);
      expect(typeormRepository.update).toHaveBeenCalledWith(
        {},
        { role: UserRole.ADMIN },
      );
    });
  });
});
