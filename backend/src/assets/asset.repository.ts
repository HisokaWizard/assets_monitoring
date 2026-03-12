/**
 * @fileoverview Кастомный репозиторий для работы с активами.
 *
 * Этот файл инкапсулирует CRUD операции и сложные запросы к базе данных
 * для сущности Asset. Repository Pattern позволяет отделить бизнес-логику
 * от логики доступа к данным и упрощает тестирование.
 *
 * @Injectable декоратор регистрирует класс как провайдер в контейнере зависимостей.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Asset } from "./asset.entity";

/**
 * Кастомный репозиторий для операций с активами.
 *
 * Инкапсулирует методы доступа к данным Asset, обеспечивая:
 * - централизацию запросов к базе данных
 * - легкое мокирование в тестах
 * - возможность смены ORM без изменения сервисов
 */
@Injectable()
export class AssetRepository {
  constructor(
    @InjectRepository(Asset)
    private readonly repository: Repository<Asset>,
  ) {}

  /**
   * Найти все активы.
   *
   * @returns Promise с массивом всех активов из базы данных.
   */
  findAll(): Promise<Asset[]> {
    return this.repository.find();
  }

  /**
   * Найти актив по ID.
   *
   * @param id Уникальный идентификатор актива.
   * @returns Promise с активом или null, если не найден.
   */
  findOneById(id: number): Promise<Asset | null> {
    return this.repository.findOneBy({ id });
  }

  /**
   * Сохранить актив.
   *
   * @param asset Актив для сохранения.
   * @returns Promise с сохранённым активом.
   */
  saveAsset(asset: Asset): Promise<Asset> {
    return this.repository.save(asset);
  }

  /**
   * Обновить актив по ID.
   *
   * @param id Идентификатор актива для обновления.
   * @param data Частичные данные для обновления.
   * @returns Promise, который разрешается после обновления.
   */
  async updateById(id: number, data: Partial<Asset>): Promise<void> {
    await this.repository.update(id, data);
  }

  /**
   * Удалить актив по ID.
   *
   * @param id Идентификатор актива для удаления.
   * @returns Promise, который разрешается после удаления.
   */
  async deleteById(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Найти все активы пользователя.
   *
   * @param userId Идентификатор пользователя.
   * @returns Promise с массивом активов пользователя.
   */
  findByUserId(userId: number): Promise<Asset[]> {
    return this.repository.find({ where: { userId } });
  }

  /**
   * Найти активы пользователя по типу.
   *
   * @param userId Идентификатор пользователя.
   * @param type Тип актива ('crypto' или 'nft').
   * @returns Promise с массивом активов указанного типа.
   */
  findByUserIdAndType(userId: number, type: string): Promise<Asset[]> {
    return this.repository.find({
      where: { userId, type: type as "crypto" | "nft" },
    });
  }

  /**
   * Сохранить несколько активов.
   *
   * @param assets Массив активов для сохранения.
   * @returns Promise с массивом сохранённых активов.
   */
  saveMany(assets: Asset[]): Promise<Asset[]> {
    return this.repository.save(assets);
  }

  /**
   * Получить QueryBuilder для создания сложных запросов.
   *
   * @returns QueryBuilder для активов.
   */
  createQueryBuilder(alias: string = "asset") {
    return this.repository.createQueryBuilder(alias);
  }

  /**
   * Найти активы по критериям.
   *
   * @param options Опциональные критерии поиска.
   * @returns Promise с массивом активов.
   */
  find(options?: {
    where?: Record<string, unknown>;
    relations?: string[];
  }): Promise<Asset[]> {
    return this.repository.find(options);
  }
}
