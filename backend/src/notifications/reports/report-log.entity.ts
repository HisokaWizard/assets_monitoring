/**
 * @fileoverview Сущность лога периодических отчётов.
 *
 * Этот файл определяет модель данных для учёта отправленных периодических отчётов.
 * Используется для обеспечения уникальности отчётов и блокировки повторной отправки.
 */

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/user.entity';

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
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID пользователя, которому был отправлен отчёт.
   */
  @Column()
  userId: number;

  /**
   * Связь с пользователем.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Период отчёта: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'.
   */
  @Column()
  period: string;

  /**
   * Время отправки отчёта.
   */
  @Column({ type: 'datetime' })
  sentAt: Date;

  /**
   * Статус отправки: 'sent' | 'failed'.
   */
  @Column({ default: 'sent' })
  status: string;
}
