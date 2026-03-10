/**
 * @fileoverview DTO для регистрации пользователя.
 *
 * Этот файл определяет структуру данных для запросов на регистрацию новых пользователей.
 * Включает валидацию email и пароля с помощью декораторов class-validator.
 * Роль назначается автоматически на уровне сервиса (UserRole.USER).
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsNotEmpty, MinLength } from "class-validator";

/**
 * DTO для регистрации пользователя.
 *
 * Определяет обязательные поля для создания нового аккаунта пользователя.
 * Содержит только email и пароль — роль назначается автоматически сервером.
 * Все поля проходят строгую валидацию для обеспечения корректности данных.
 */
export class RegisterDto {
  /**
   * Email пользователя.
   *
   * Должен быть валидным email адресом.
   * @IsEmail() проверяет формат email.
   */
  @ApiProperty({
    description: "Email пользователя",
    example: "user@example.com",
  })
  @IsEmail()
  email!: string;

  /**
   * Пароль пользователя.
   *
   * Должен быть строкой не короче 6 символов.
   * @IsString(), @IsNotEmpty(), @MinLength(6) обеспечивают требования к паролю.
   */
  @ApiProperty({
    description: "Пароль (минимум 6 символов)",
    example: "password123",
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
