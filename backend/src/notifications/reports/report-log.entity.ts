/**
 * @fileoverview Сущность лога периодических отчётов.
 *
 * Этот файл определяет модель данных для учёта отправленных периодических отчётов.
 * Используется для обеспечения уникальности отчётов и блокировки повторной отправки.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty, ApiHideProperty } from "@nestjs/swagger";
import { User } from "../../auth/user.entity";

/**
 * Сущность лога периодических отчётов.
 *
 * Хранит историю отправленных отчётов (daily, weekly, monthly, quarterly, yearly)
 * для каждого пользователя. Позволяет определить, когда был отправлен последний
 * отчёт за конкретный период, и заблокировать повторную отправку.
 *
 * @Entity декоратор указывает, что класс соответствует таблице в БД.
 */
@Entity()
export class ReportLog {
  /**
   * Уникальный идентификатор записи.
   */
  @ApiProperty({ description: "Уникальный идентификатор записи", example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * ID пользователя, которому был отправлен отчёт.
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
   * Период отчёта: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'.
   */
  @ApiProperty({
    description: "Период отчёта",
    enum: ["daily", "weekly", "monthly", "quarterly", "yearly"],
    example: "weekly",
  })
  @Column()
  period!: string;

  /**
   * Время отправки отчёта.
   */
  @ApiProperty({
    description: "Время отправки отчёта",
    example: "2026-03-10T12:00:00.000Z",
  })
  @Column({ type: "datetime" })
  sentAt!: Date;

  /**
   * Статус отправки: 'sent' | 'failed'.
   */
  @ApiProperty({
    description: "Статус отправки",
    enum: ["sent", "failed"],
    default: "sent",
    example: "sent",
  })
  @Column({ default: "sent" })
  status!: string;
}
