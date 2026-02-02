/**
 * @fileoverview Сущность логов уведомлений для базы данных.
 *
 * Этот файл определяет модель данных для логирования отправленных уведомлений.
 * Включает информацию о получателе, типе и статусе отправки.
 */

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';

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
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID пользователя-получателя.
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
   * Тип уведомления (alert, report).
   */
  @Column()
  type: string;

  /**
   * Тема уведомления.
   */
  @Column()
  subject: string;

  /**
   * Текст сообщения.
   */
  @Column('text')
  message: string;

  /**
   * Время отправки.
   */
  @Column({ type: 'datetime' })
  sentAt: Date;

  /**
   * Статус отправки (sent, failed).
   */
  @Column({ default: 'sent' })
  status: string;
}
