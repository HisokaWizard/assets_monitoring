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
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * ID пользователя.
   */
  @Column()
  userId!: number;

  /**
   * Связь с пользователем.
   */
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  /**
   * API-ключ CoinMarketCap.
   * Хранится в зашифрованном виде.
   */
  @Column({ type: "varchar", length: 500, nullable: true })
  coinmarketcapApiKey?: string;

  /**
   * API-ключ OpenSea.
   * Хранится в зашифрованном виде.
   */
  @Column({ type: "varchar", length: 500, nullable: true })
  openseaApiKey?: string;

  /**
   * Дата создания записи.
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Дата последнего обновления.
   */
  @UpdateDateColumn()
  updatedAt!: Date;
}
