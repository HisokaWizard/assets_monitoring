/**
 * @fileoverview Сущность настроек API пользователя.
 *
 * Хранит API-ключи для внешних сервисов (CoinMarketCap, OpenSea).
 * Связана с пользователем отношением ManyToOne.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from "@nestjs/swagger";
import { User } from "../../../auth/user.entity";

/**
 * Сущность настроек API пользователя.
 *
 * @Entity декоратор указывает, что класс соответствует таблице в БД.
 */
@Entity("user_settings")
export class UserSettings {
  /**
   * Уникальный идентификатор настроек.
   */
  @ApiProperty({ description: "ID настроек", example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * ID пользователя.
   */
  @ApiProperty({ description: "ID пользователя", example: 1 })
  @Column()
  userId!: number;

  /**
   * Связь с пользователем.
   */
  @ApiHideProperty()
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  /**
   * API-ключ CoinMarketCap.
   * Хранится в зашифрованном виде.
   */
  @ApiPropertyOptional({ description: "API-ключ CoinMarketCap" })
  @Column({ type: "varchar", length: 500, nullable: true })
  coinmarketcapApiKey?: string;

  /**
   * API-ключ OpenSea.
   * Хранится в зашифрованном виде.
   */
  @ApiPropertyOptional({ description: "API-ключ OpenSea" })
  @Column({ type: "varchar", length: 500, nullable: true })
  openseaApiKey?: string;

  /**
   * Дата создания записи.
   */
  @ApiProperty({ description: "Дата создания" })
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Дата последнего обновления.
   */
  @ApiProperty({ description: "Дата обновления" })
  @UpdateDateColumn()
  updatedAt!: Date;
}
