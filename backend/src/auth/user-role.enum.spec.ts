/**
 * @fileoverview Unit-тесты для enum UserRole.
 *
 * RED-фаза TDD: тесты написаны ДО реализации.
 * Файл user-role.enum.ts ещё не существует — все тесты должны упасть.
 *
 * Тесткейсы:
 * 1. UserRole.USER === 'user'
 * 2. UserRole.ADMIN === 'admin'
 * 3. Enum содержит ровно 2 значения (USER, ADMIN)
 */

import { UserRole } from "./user-role.enum";

describe("UserRole", () => {
  describe("when accessing enum values", () => {
    it('should have USER value equal to "user"', () => {
      // Arrange
      const expectedValue = "user";

      // Act
      const actualValue = UserRole.USER;

      // Assert
      expect(actualValue).toBe(expectedValue);
    });

    it('should have ADMIN value equal to "admin"', () => {
      // Arrange
      const expectedValue = "admin";

      // Act
      const actualValue = UserRole.ADMIN;

      // Assert
      expect(actualValue).toBe(expectedValue);
    });
  });

  describe("when checking enum completeness", () => {
    it("should only contain USER and ADMIN values", () => {
      // Arrange
      const expectedCount = 2;

      // Act
      const enumValues = Object.values(UserRole);

      // Assert
      expect(enumValues).toHaveLength(expectedCount);
      expect(enumValues).toContain("user");
      expect(enumValues).toContain("admin");
    });
  });
});
