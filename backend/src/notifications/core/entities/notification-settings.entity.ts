/**
 * @fileoverview Сущность настроек уведомлений для базы данных.
 *
 * Этот файл определяет модель данных для настроек уведомлений пользователей.
 * Включает настройки для типов активов, порогов и интервалов.
 *
 * Используется для управления уведомлениями о изменениях цен.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from "@nestjs/swagger";
import { User } from "../../../auth/user.entity";

/**
 * Сущность настроек уведомлений.
 *
 * Определяет настройки уведомлений для пользователя по типам активов.
 * Включает порог изменения цены, интервал проверки и статус.
 *
 * @Entity декоратор указывает, что класс соответствует таблице в БД.
 */
@Entity()
export class NotificationSettings {
  /**
   * Уникальный идентификатор настройки.
   */
  @ApiProperty({
    description: "Уникальный идентификатор настройки",
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * ID пользователя, которому принадлежит настройка.
   */
  @ApiProperty({ description: "ID пользователя", example: 1 })
  @Column()
  userId!: number;

  /**
   * Связь с пользователем.
   */
  @ApiHideProperty()
  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  /**
   * Тип актива (crypto, nft).
   */
  @ApiProperty({
    description: "Тип актива",
    enum: ["crypto", "nft"],
    example: "crypto",
  })
  @Column()
  assetType!: string;

  /**
   * Включены ли уведомления для этого типа.
   */
  @ApiProperty({
    description: "Включены ли уведомления",
    default: true,
    example: true,
  })
  @Column({ default: true })
  enabled!: boolean;

  /**
   * Порог изменения цены в процентах (по умолчанию 10).
   */
  @ApiProperty({
    description: "Порог изменения цены (%)",
    default: 10,
    example: 10,
  })
  @Column("decimal", { default: 10 })
  thresholdPercent!: number;

  /**
   * Интервал проверки в часах (2,4,6,8,10,12).
   */
  @ApiProperty({
    description: "Интервал проверки (часы)",
    enum: [2, 4, 6, 8, 10, 12],
    default: 4,
    example: 4,
  })
  @Column({ default: 4 })
  intervalHours!: number;

  /**
   * Интервал обновлений активов в часах (по умолчанию 4).
   */
  @ApiProperty({
    description: "Интервал обновления активов (часы)",
    default: 4,
    example: 4,
  })
  @Column({ default: 4 })
  updateIntervalHours!: number;

  /**
   * Время последнего уведомления.
   */
  @ApiPropertyOptional({
    description: "Время последнего уведомления",
    nullable: true,
    example: "2026-03-10T12:00:00.000Z",
  })
  @Column({ type: "datetime", nullable: true })
  lastNotified!: Date | null;
}
