/**
 * @fileoverview DTO для входа в систему.
 *
 * Этот файл определяет структуру данных для запросов на аутентификацию пользователей.
 * Используется для валидации данных при попытке входа в систему.
 */

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsNotEmpty } from "class-validator";

/**
 * DTO для входа пользователя.
 *
 * Определяет поля, необходимые для аутентификации: email и пароль.
 * Валидируется для обеспечения корректности входных данных.
 */
export class LoginDto {
  /**
   * Email пользователя.
   *
   * Должен быть валидным email адресом.
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
   * Должен быть непустой строкой.
   */
  @ApiProperty({ description: "Пароль пользователя", example: "password123" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
