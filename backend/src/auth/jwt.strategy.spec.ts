import { JwtStrategy } from "./jwt.strategy";
import { User } from "./user.entity";
import { UserRole } from "./user-role.enum";

describe("JwtStrategy", () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    // Mock JWT_SECRET
    process.env.JWT_SECRET = "test_secret";
    strategy = new JwtStrategy();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validate", () => {
    it("should return user object from payload", async () => {
      const payload = {
        email: "test@example.com",
        sub: 1,
        role: UserRole.USER,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 1,
        email: "test@example.com",
        password: "",
        role: UserRole.USER,
        lastUpdated: null,
      });
    });

    it("should map sub to userId correctly", async () => {
      const payload = {
        email: "user@example.com",
        sub: 123,
        role: UserRole.ADMIN,
      };

      const result = await strategy.validate(payload);

      expect(result.id).toBe(123);
    });

    it("should pass email from payload", async () => {
      const payload = {
        email: "test@example.com",
        sub: 1,
        role: UserRole.USER,
      };

      const result = await strategy.validate(payload);

      expect(result.email).toBe("test@example.com");
    });

    it("should pass role from payload", async () => {
      const payload = {
        email: "admin@example.com",
        sub: 1,
        role: UserRole.ADMIN,
      };

      const result = await strategy.validate(payload);

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it("should return empty password for security", async () => {
      const payload = {
        email: "test@example.com",
        sub: 1,
        role: UserRole.USER,
      };

      const result = await strategy.validate(payload);

      expect(result.password).toBe("");
    });

    it("should return null for lastUpdated", async () => {
      const payload = {
        email: "test@example.com",
        sub: 1,
        role: UserRole.USER,
      };

      const result = await strategy.validate(payload);

      expect(result.lastUpdated).toBeNull();
    });

    it("should handle different user roles", async () => {
      const roles: (UserRole | string)[] = [
        UserRole.USER,
        UserRole.ADMIN,
        "moderator",
      ];

      for (const role of roles) {
        const payload = {
          email: `${role}@example.com`,
          sub: 1,
          role: role,
        };

        const result = await strategy.validate(payload);

        expect(result.role).toBe(role);
      }
    });
  });
});
