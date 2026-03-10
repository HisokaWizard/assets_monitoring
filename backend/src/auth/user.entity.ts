/**
 * @fileoverview Сущность пользователя для базы данных.
 *
 * Этот файл определяет модель данных для пользователей системы аутентификации.
 * Сущность представляет таблицу пользователей с полями для email, пароля и роли.
 *
 * Используется для регистрации, входа в систему и управления доступом.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  ApiProperty,
  ApiHideProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { UserRole } from "./user-role.enum";

/**
 * Сущность пользователя.
 *
 * Определяет структуру таблицы пользователей в базе данных.
 * Содержит информацию, необходимую для аутентификации и авторизации.
 *
 * @Entity декоратор указывает, что класс соответствует таблице в БД.
 */
@Entity()
export class User {
  /**
   * Уникальный идентификатор пользователя.
   *
   * Автоинкрементный первичный ключ.
   */
  @ApiProperty({
    description: "Уникальный идентификатор пользователя",
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Email пользователя.
   *
   * Должен быть уникальным в системе.
   * @Column({ unique: true }) обеспечивает уникальность на уровне базы данных.
   */
  @ApiProperty({
    description: "Email пользователя",
    example: "user@example.com",
  })
  @Column({ unique: true })
  email!: string;

  /**
   * Хэшированный пароль пользователя.
   *
   * Хранится в зашифрованном виде для безопасности.
   */
  @ApiHideProperty()
  @Column()
  password!: string;

  /**
   * Роль пользователя в системе.
   *
   * Определяет уровень доступа: {@link UserRole.USER} или {@link UserRole.ADMIN}.
   * Используется для авторизации и контроля доступа к ресурсам.
   * Хранится как текстовое поле для совместимости с SQLite.
   */
  @ApiProperty({
    description: "Роль пользователя",
    enum: UserRole,
    example: UserRole.USER,
  })
  @Column({ type: "text", default: UserRole.USER })
  role!: UserRole;

  /**
   * Дата создания пользователя.
   */
  @ApiProperty({
    description: "Дата создания пользователя",
    example: "2025-01-01T00:00:00.000Z",
  })
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Дата обновления пользователя.
   */
  @ApiProperty({
    description: "Дата последнего обновления пользователя",
    example: "2025-01-01T00:00:00.000Z",
  })
  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Время последнего обновления активов.
   */
  @ApiPropertyOptional({
    description: "Время последнего обновления активов",
    example: "2025-01-01T00:00:00.000Z",
    nullable: true,
  })
  @Column({ type: "datetime", nullable: true })
  lastUpdated?: Date;
}
