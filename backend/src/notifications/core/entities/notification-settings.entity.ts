/**
 * @fileoverview Сущность настроек уведомлений для базы данных.
 *
 * Этот файл определяет модель данных для настроек уведомлений пользователей.
 * Включает настройки для типов активов, порогов и интервалов.
 *
 * Используется для управления уведомлениями о изменениях цен.
 */

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../../auth/user.entity';

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
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID пользователя, которому принадлежит настройка.
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
   * Тип актива (crypto, nft).
   */
  @Column()
  assetType: string;

  /**
   * Включены ли уведомления для этого типа.
   */
  @Column({ default: true })
  enabled: boolean;

  /**
   * Порог изменения цены в процентах (по умолчанию 10).
   */
  @Column('decimal', { default: 10 })
  thresholdPercent: number;

  /**
   * Интервал проверки в часах (2,4,6,8,10,12).
   */
  @Column({ default: 4 })
  intervalHours: number;

  /**
   * Интервал обновлений активов в часах (по умолчанию 4).
   */
  @Column({ default: 4 })
  updateIntervalHours: number;

  /**
   * Время последнего уведомления.
   */
  @Column({ type: 'datetime', nullable: true })
  lastNotified: Date;
}
