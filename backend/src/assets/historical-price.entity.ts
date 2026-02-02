/**
 * @fileoverview Сущность исторических цен активов для базы данных.
 *
 * Этот файл определяет модель данных для хранения исторических цен активов.
 * Используется для графиков и будущих предсказаний LLM.
 */

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Asset } from './asset.entity';

/**
 * Сущность исторической цены.
 *
 * Хранит цены активов по времени для анализа и графиков.
 * Связана с активом для получения истории цен.
 *
 * @Entity декоратор указывает, что класс соответствует таблице в БД.
 */
@Entity()
export class HistoricalPrice {
  /**
   * Уникальный идентификатор записи.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID актива.
   */
  @Column()
  assetId: number;

  /**
   * Связь с активом.
   */
  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  /**
   * Цена актива.
   */
  @Column('decimal')
  price: number;

  /**
   * Временная метка цены.
   */
  @Column({ type: 'datetime' })
  timestamp: Date;

  /**
   * Источник данных (CoinMarketCap, OpenSea).
   */
  @Column({ default: 'API' })
  source: string;
}
