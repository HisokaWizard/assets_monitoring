/**
 * @fileoverview Сущность исторических цен активов для базы данных.
 *
 * Этот файл определяет модель данных для хранения исторических цен активов.
 * Используется для графиков и будущих предсказаний LLM.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ApiProperty, ApiHideProperty } from "@nestjs/swagger";
import { Asset } from "./asset.entity";

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
  @ApiProperty({ description: "Уникальный идентификатор записи", example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * ID актива.
   */
  @ApiProperty({ description: "ID актива", example: 1 })
  @Column()
  assetId!: number;

  /**
   * Связь с активом.
   */
  @ApiHideProperty()
  @ManyToOne(() => Asset, { onDelete: "CASCADE" })
  @JoinColumn({ name: "assetId" })
  asset!: Asset;

  /**
   * Цена актива.
   */
  @ApiProperty({ description: "Цена актива", example: 67000 })
  @Column("decimal")
  price!: number;

  /**
   * Временная метка цены.
   */
  @ApiProperty({
    description: "Временная метка цены",
    example: "2026-03-09T12:00:00.000Z",
  })
  @Column({ type: "datetime" })
  timestamp!: Date;

  /**
   * Источник данных (CoinMarketCap, OpenSea).
   */
  @ApiProperty({ description: "Источник данных", example: "CoinMarketCap" })
  @Column({ default: "API" })
  source!: string;
}
