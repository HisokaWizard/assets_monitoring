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
} from 'typeorm';
import { User } from '../auth/user.entity';

/**
 * Базовая сущность актива.
 *
 * Содержит общие поля для всех типов активов.
 * Использует Table Per Class inheritance, где каждая подсущность имеет свою таблицу.
 */
@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Asset {
  /**
   * Уникальный идентификатор актива.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Количество актива.
   */
  @Column('decimal')
  amount: number;

  /**
   * Средняя цена.
   */
  @Column('decimal')
  middlePrice: number;

  /**
   * Предыдущая цена.
   */
  @Column('decimal')
  previousPrice: number;

  /**
   * Множитель.
   */
  @Column('decimal')
  multiple: number;

  /**
   * Изменение за день.
   */
  @Column('decimal')
  dailyChange: number;

  /**
   * Изменение за неделю.
   */
  @Column('decimal')
  weeklyChange: number;

  /**
   * Изменение за месяц.
   */
  @Column('decimal')
  monthlyChange: number;

  /**
   * Изменение за квартал.
   */
  @Column('decimal')
  quartChange: number;

  /**
   * Изменение за год.
   */
  @Column('decimal')
  yearChange: number;

  /**
   * Общее изменение.
   */
  @Column('decimal')
  totalChange: number;

  /**
   * Цена за день.
   */
  @Column({ type: 'decimal', nullable: true })
  dailyPrice: number;

  /**
   * Временная метка за день.
   */
  @Column({ type: 'datetime', nullable: true })
  dailyTimestamp: Date;

  /**
   * Цена за неделю.
   */
  @Column({ type: 'decimal', nullable: true })
  weeklyPrice: number;

  /**
   * Временная метка за неделю.
   */
  @Column({ type: 'datetime', nullable: true })
  weeklyTimestamp: Date;

  /**
   * Цена за месяц.
   */
  @Column({ type: 'decimal', nullable: true })
  monthlyPrice: number;

  /**
   * Временная метка за месяц.
   */
  @Column({ type: 'datetime', nullable: true })
  monthlyTimestamp: Date;

  /**
   * Цена за квартал.
   */
  @Column({ type: 'decimal', nullable: true })
  quartPrice: number;

  /**
   * Временная метка за квартал.
   */
  @Column({ type: 'datetime', nullable: true })
  quartTimestamp: Date;

  /**
   * Цена за год.
   */
  @Column({ type: 'decimal', nullable: true })
  yearPrice: number;

  /**
   * Временная метка за год.
   */
  @Column({ type: 'datetime', nullable: true })
  yearTimestamp: Date;

  /**
   * ID пользователя, которому принадлежит актив.
   */
  @Column()
  userId: number;

  /**
   * Связь с пользователем.
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}

/**
 * Сущность криптоактива.
 *
 * Наследует от Asset и добавляет специфичные поля для криптовалют.
 */
@ChildEntity('crypto')
export class CryptoAsset extends Asset {
  /**
   * Символ криптовалюты (например, "BTC").
   */
  @Column()
  symbol: string;

  /**
   * Полное название криптовалюты (например, "Bitcoin").
   */
  @Column()
  fullName: string;

  /**
   * Текущая цена криптовалюты.
   */
  @Column('decimal')
  currentPrice: number;
}

/**
 * Сущность NFT актива.
 *
 * Наследует от Asset и добавляет специфичные поля для NFT.
 */
@ChildEntity('nft')
export class NFTAsset extends Asset {
  /**
   * Название коллекции NFT.
   */
  @Column()
  collectionName: string;

  /**
   * Цена пола коллекции.
   */
  @Column('decimal')
  floorPrice: number;

  /**
   * Цена по признакам.
   */
  @Column('decimal')
  traitPrice: number;
}
