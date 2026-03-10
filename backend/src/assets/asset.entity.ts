/**
 * @fileoverview Сущность актива для базы данных.
 *
 * Этот файл определяет модель данных для активов с использованием TypeORM inheritance.
 * Базовая сущность Asset содержит общие поля, а подсущности CryptoAsset и NFTAsset
 * наследуют от нее с использованием Table Per Class стратегии.
 *
 * Декоратор @Entity указывает, что класс является сущностью базы данных.
 * @PrimaryGeneratedColumn создает автоинкрементный первичный ключ.
 * @Column определяет столбцы таблицы с типами данных.
 * @TableInheritance определяет стратегию наследования.
 * @ChildEntity указывает на подсущность с собственной таблицей.
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  TableInheritance,
  ChildEntity,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from "@nestjs/swagger";
import { User } from "../auth/user.entity";

/**
 * Базовая сущность актива.
 *
 * Содержит общие поля для всех типов активов.
 * Использует Table Per Class inheritance, где каждая подсущность имеет свою таблицу.
 */
@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export class Asset {
  /**
   * Уникальный идентификатор актива.
   */
  @ApiProperty({ description: "Уникальный идентификатор актива", example: 1 })
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * Тип актива (crypto или nft).
   */
  @ApiProperty({
    description: "Тип актива",
    enum: ["crypto", "nft"],
    example: "crypto",
  })
  @Column({ name: "type", nullable: true })
  type!: "crypto" | "nft";

  /**
   * Количество актива.
   */
  @ApiProperty({ description: "Количество актива", example: 1.5 })
  @Column("decimal")
  amount!: number;

  /**
   * Средняя цена.
   */
  @ApiProperty({ description: "Средняя цена покупки", example: 45000 })
  @Column("decimal")
  middlePrice!: number;

  /**
   * Предыдущая цена.
   */
  @ApiProperty({ description: "Предыдущая цена", example: 44000 })
  @Column("decimal")
  previousPrice!: number;

  /**
   * Множитель.
   */
  @ApiProperty({ description: "Множитель", example: 1.02 })
  @Column("decimal")
  multiple!: number;

  /**
   * Изменение за день.
   */
  @ApiProperty({ description: "Изменение за день (%)", example: 2.5 })
  @Column("decimal")
  dailyChange!: number;

  /**
   * Изменение за неделю.
   */
  @ApiProperty({ description: "Изменение за неделю (%)", example: 5.0 })
  @Column("decimal")
  weeklyChange!: number;

  /**
   * Изменение за месяц.
   */
  @ApiProperty({ description: "Изменение за месяц (%)", example: 10.0 })
  @Column("decimal")
  monthlyChange!: number;

  /**
   * Изменение за квартал.
   */
  @ApiProperty({ description: "Изменение за квартал (%)", example: 15.0 })
  @Column("decimal")
  quartChange!: number;

  /**
   * Изменение за год.
   */
  @ApiProperty({ description: "Изменение за год (%)", example: 50.0 })
  @Column("decimal")
  yearChange!: number;

  /**
   * Общее изменение (%).
   */
  @ApiProperty({ description: "Общее изменение (%)", example: 48.9 })
  @Column("decimal")
  totalChange!: number;

  /**
   * Изменение за день ($).
   */
  @ApiPropertyOptional({
    description: "Изменение за день ($)",
    example: 1125.0,
  })
  @Column({ type: "decimal", nullable: true, default: 0 })
  dailyChangeUsd!: number;

  /**
   * Изменение за неделю ($).
   */
  @ApiPropertyOptional({
    description: "Изменение за неделю ($)",
    example: 2250.0,
  })
  @Column({ type: "decimal", nullable: true, default: 0 })
  weeklyChangeUsd!: number;

  /**
   * Изменение за месяц ($).
   */
  @ApiPropertyOptional({
    description: "Изменение за месяц ($)",
    example: 4500.0,
  })
  @Column({ type: "decimal", nullable: true, default: 0 })
  monthlyChangeUsd!: number;

  /**
   * Изменение за квартал ($).
   */
  @ApiPropertyOptional({
    description: "Изменение за квартал ($)",
    example: 6750.0,
  })
  @Column({ type: "decimal", nullable: true, default: 0 })
  quartChangeUsd!: number;

  /**
   * Изменение за год ($).
   */
  @ApiPropertyOptional({
    description: "Изменение за год ($)",
    example: 22500.0,
  })
  @Column({ type: "decimal", nullable: true, default: 0 })
  yearChangeUsd!: number;

  /**
   * Общее изменение ($).
   */
  @ApiPropertyOptional({ description: "Общее изменение ($)", example: 22005.0 })
  @Column({ type: "decimal", nullable: true, default: 0 })
  totalChangeUsd!: number;

  /**
   * Цена за день.
   */
  @ApiPropertyOptional({ description: "Цена на начало дня", example: 44000 })
  @Column({ type: "decimal", nullable: true })
  dailyPrice!: number;

  /**
   * Временная метка за день.
   */
  @ApiPropertyOptional({
    description: "Временная метка за день",
    example: "2026-03-09T00:00:00.000Z",
  })
  @Column({ type: "datetime", nullable: true })
  dailyTimestamp!: Date;

  /**
   * Цена за неделю.
   */
  @ApiPropertyOptional({ description: "Цена на начало недели", example: 43000 })
  @Column({ type: "decimal", nullable: true })
  weeklyPrice!: number;

  /**
   * Временная метка за неделю.
   */
  @ApiPropertyOptional({
    description: "Временная метка за неделю",
    example: "2026-03-02T00:00:00.000Z",
  })
  @Column({ type: "datetime", nullable: true })
  weeklyTimestamp!: Date;

  /**
   * Цена за месяц.
   */
  @ApiPropertyOptional({ description: "Цена на начало месяца", example: 42000 })
  @Column({ type: "decimal", nullable: true })
  monthlyPrice!: number;

  /**
   * Временная метка за месяц.
   */
  @ApiPropertyOptional({
    description: "Временная метка за месяц",
    example: "2026-02-09T00:00:00.000Z",
  })
  @Column({ type: "datetime", nullable: true })
  monthlyTimestamp!: Date;

  /**
   * Цена за квартал.
   */
  @ApiPropertyOptional({
    description: "Цена на начало квартала",
    example: 38000,
  })
  @Column({ type: "decimal", nullable: true })
  quartPrice!: number;

  /**
   * Временная метка за квартал.
   */
  @ApiPropertyOptional({
    description: "Временная метка за квартал",
    example: "2025-12-09T00:00:00.000Z",
  })
  @Column({ type: "datetime", nullable: true })
  quartTimestamp!: Date;

  /**
   * Цена за год.
   */
  @ApiPropertyOptional({ description: "Цена на начало года", example: 30000 })
  @Column({ type: "decimal", nullable: true })
  yearPrice!: number;

  /**
   * Временная метка за год.
   */
  @ApiPropertyOptional({
    description: "Временная метка за год",
    example: "2025-03-09T00:00:00.000Z",
  })
  @Column({ type: "datetime", nullable: true })
  yearTimestamp!: Date;

  /**
   * ID пользователя, которому принадлежит актив.
   */
  @ApiProperty({ description: "ID пользователя-владельца", example: 1 })
  @Column()
  userId!: number;

  /**
   * Связь с пользователем.
   */
  @ApiHideProperty()
  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;
}

/**
 * Сущность криптоактива.
 *
 * Наследует от Asset и добавляет специфичные поля для криптовалют.
 */
@ChildEntity("crypto")
export class CryptoAsset extends Asset {
  /**
   * Символ криптовалюты (например, "BTC").
   */
  @ApiPropertyOptional({ description: "Символ криптовалюты", example: "BTC" })
  @Column({ nullable: true })
  symbol!: string;

  /**
   * Полное название криптовалюты (например, "Bitcoin").
   */
  @ApiPropertyOptional({
    description: "Полное название криптовалюты",
    example: "Bitcoin",
  })
  @Column({ nullable: true })
  fullName!: string;

  /**
   * Текущая цена криптовалюты.
   */
  @ApiPropertyOptional({
    description: "Текущая цена криптовалюты",
    example: 67000,
  })
  @Column({ type: "decimal", nullable: true })
  currentPrice!: number;
}

/**
 * Сущность NFT актива.
 *
 * Наследует от Asset и добавляет специфичные поля для NFT.
 * middlePrice (из базового Asset) хранится в нативном токене коллекции.
 * floorPrice хранится в нативном токене (из OpenSea).
 * floorPriceUsd и middlePriceUsd — соответствующие USD-значения.
 */
@ChildEntity("nft")
export class NFTAsset extends Asset {
  /**
   * Название коллекции NFT (slug для OpenSea API).
   */
  @ApiPropertyOptional({
    description: "Название коллекции NFT (slug)",
    example: "bored-ape-yacht-club",
  })
  @Column({ nullable: true })
  collectionName!: string;

  /**
   * Символ нативного токена коллекции (например, 'ETH', 'SOL', 'WETH', 'ATOM').
   * Используется для получения курса через CoinMarketCap.
   */
  @ApiPropertyOptional({
    description: "Нативный токен коллекции",
    example: "ETH",
  })
  @Column({ nullable: true })
  nativeToken!: string;

  /**
   * Цена пола коллекции в нативном токене (из OpenSea floor_price).
   */
  @ApiPropertyOptional({
    description: "Цена пола коллекции в нативном токене",
    example: 30.5,
  })
  @Column({ type: "decimal", nullable: true })
  floorPrice!: number;

  /**
   * Цена пола коллекции в USD (из OpenSea floor_price_usd).
   */
  @ApiPropertyOptional({
    description: "Цена пола коллекции в USD",
    example: 95000.5,
  })
  @Column({ type: "decimal", nullable: true })
  floorPriceUsd!: number;

  /**
   * Средняя цена покупки в USD (middlePrice * курс nativeToken из CoinMarketCap).
   * Рассчитывается при создании актива и обновляется при refresh.
   */
  @ApiPropertyOptional({
    description: "Средняя цена покупки в USD",
    example: 140000.0,
  })
  @Column({ type: "decimal", nullable: true })
  middlePriceUsd!: number;

  /**
   * Цена по признакам (trait price) в нативном токене.
   */
  @ApiPropertyOptional({
    description: "Цена по признакам в нативном токене",
    example: 45.0,
  })
  @Column({ type: "decimal", nullable: true })
  traitPrice!: number;
}
