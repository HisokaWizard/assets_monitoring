/**
 * @fileoverview Кастомный репозиторий для работы с историческими ценами.
 *
 * Этот файл инкапсулирует операции доступа к данным для сущности HistoricalPrice.
 * Используется для хранения и получения истории цен активов по времени.
 *
 * @Injectable декоратор регистрирует класс как провайдер в контейнере зависимостей.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HistoricalPrice } from "./historical-price.entity";

/**
 * Интерфейс для данных, необходимых при сохранении исторической цены.
 */
export interface SaveHistoricalPriceData {
  /** ID актива */
  assetId: number;
  /** Цена актива */
  price: number;
  /** Время записи цены */
  timestamp: Date;
  /** Источник данных (CoinMarketCap, OpenSea и т.д.) */
  source: string;
}

/**
 * Кастомный репозиторий для операций с историческими ценами.
 *
 * Инкапсулирует методы для сохранения и получения исторических данных о ценах.
 */
@Injectable()
export class HistoricalPriceRepository {
  constructor(
    @InjectRepository(HistoricalPrice)
    private readonly repository: Repository<HistoricalPrice>,
  ) {}

  /**
   * Сохранить историческую цену.
   *
   * @param data Данные для сохранения (assetId, price, timestamp, source).
   * @returns Promise с сохранённой записью исторической цены.
   */
  async savePrice(data: SaveHistoricalPriceData): Promise<HistoricalPrice> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Найти цены актива по ID (по убыванию даты).
   *
   * @param assetId ID актива.
   * @param take Количество записей для получения.
   * @returns Promise с массивом исторических цен, отсортированных по убыванию даты.
   */
  findByAssetIdDesc(assetId: number, take: number): Promise<HistoricalPrice[]> {
    return this.repository.find({
      where: { assetId },
      order: { timestamp: "DESC" },
      take,
    });
  }

  /**
   * Получить QueryBuilder для создания сложных запросов.
   *
   * @param alias Псевдоним для запроса.
   * @returns QueryBuilder для исторических цен.
   */
  createQueryBuilder(alias: string = "historicalPrice") {
    return this.repository.createQueryBuilder(alias);
  }
}
