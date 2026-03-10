/**
 * @fileoverview Сущность логов уведомлений для базы данных.
 *
 * Этот файл определяет модель данных для логирования отправленных уведомлений.
 * Включает информацию о получателе, типе и статусе отправки.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty, ApiHideProperty } from "@nestjs/swagger";
import { User } from "../../../auth/user.entity";

/**
 * Сущность лога уведомлений.
 *
 * Хранит историю отправленных уведомлений для аудита и отладки.
 * Включает тип уведомления (alert, report), статус и время отправки.
 *
 * @Entity декоратор указывает, что класс соответствует таблице в БД.
 */
@Entity()
export class NotificationLog {
  /**
   * Уникальный идентификатор лога.
   */
  @ApiProperty({ description: "Уникальный идентификатор лога", example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * ID пользователя-получателя.
   */
  @ApiProperty({ description: "ID пользователя-получателя", example: 1 })
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
   * Тип уведомления (alert, report).
   */
  @ApiProperty({
    description: "Тип уведомления",
    enum: ["alert", "report"],
    example: "alert",
  })
  @Column()
  type!: string;

  /**
   * Тема уведомления.
   */
  @ApiProperty({
    description: "Тема уведомления",
    example: "Изменение цены BTC",
  })
  @Column()
  subject!: string;

  /**
   * Текст сообщения.
   */
  @ApiProperty({
    description: "Текст сообщения",
    example: "Цена BTC выросла на 15%",
  })
  @Column("text")
  message!: string;

  /**
   * Время отправки.
   */
  @ApiProperty({
    description: "Время отправки",
    example: "2026-03-10T12:00:00.000Z",
  })
  @Column({ type: "datetime" })
  sentAt!: Date;

  /**
   * Статус отправки (sent, failed).
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
