import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationSettings } from "./entities/notification-settings.entity";

/**
 * Репозиторий для работы с настройками уведомлений.
 *
 * Инкапсулирует CRUD операции и сложные запросы к таблице notification_settings.
 */
@Injectable()
export class NotificationSettingsRepository {
  constructor(
    @InjectRepository(NotificationSettings)
    private readonly repository: Repository<NotificationSettings>,
  ) {}

  /**
   * Возвращает доступ к原始ному репозиторию TypeORM.
   * Используется для специфических операций.
   */
  get repositoryTypeOrm(): Repository<NotificationSettings> {
    return this.repository;
  }

  /**
   * Находит все включенные настройки уведомлений.
   *
   * @param userId Опциональный ID пользователя для фильтрации
   * @returns Массив включенных настроек
   */
  findEnabledWithUser(userId?: number): Promise<NotificationSettings[]> {
    let query = this.repository
      .createQueryBuilder("setting")
      .leftJoinAndSelect("setting.user", "user")
      .where("setting.enabled = :enabled", { enabled: true });

    if (userId) {
      query = query.andWhere("setting.userId = :userId", { userId });
    }

    return query.getMany();
  }

  /**
   * Находит настройки уведомлений по ID пользователя.
   *
   * @param userId ID пользователя
   * @returns Массив настроек пользователя
   */
  findByUserId(userId: number): Promise<NotificationSettings[]> {
    return this.repository.find({
      where: { userId },
      order: { assetType: "ASC", id: "DESC" },
    });
  }

  /**
   * Находит одну настройку по ID пользователя и типу актива.
   *
   * @param userId ID пользователя
   * @param assetType Тип актива (crypto/nft)
   * @returns Настройка или null
   */
  findOneByUserIdAndAssetType(
    userId: number,
    assetType: string,
  ): Promise<NotificationSettings | null> {
    return this.repository.findOneBy({ userId, assetType });
  }

  /**
   * Создает и сохраняет новую настройку уведомлений.
   *
   * @param data Данные для создания настройки
   * @returns Сохраненная настройка
   */
  createAndSave(
    data: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Обновляет настройку по ID и ID пользователя.
   *
   * @param id ID настройки
   * @param userId ID пользователя
   * @param data Данные для обновления
   */
  async updateByIdAndUserId(
    id: number,
    userId: number,
    data: Partial<NotificationSettings>,
  ): Promise<void> {
    await this.repository.update({ id, userId }, data);
  }

  /**
   * Находит одну настройку по ID.
   *
   * @param id ID настройки
   * @returns Настройка или null
   */
  findOneById(id: number): Promise<NotificationSettings | null> {
    return this.repository.findOneBy({ id });
  }

  /**
   * Удаляет настройку по ID и ID пользователя.
   *
   * @param id ID настройки
   * @param userId ID пользователя
   * @returns Количество удаленных записей
   */
  async deleteByIdAndUserId(id: number, userId: number): Promise<number> {
    const result = await this.repository.delete({ id, userId });
    return result.affected || 0;
  }

  /**
   * Сохраняет настройку (обновление или создание).
   *
   * @param settings Настройка для сохранения
   * @returns Сохраненная настройка
   */
  saveSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    return this.repository.save(settings);
  }

  /**
   * Найти настройки по критериям.
   *
   * @param options Опциональные критерии поиска.
   * @returns Массив найденных настроек.
   */
  find(options?: {
    where?: Record<string, unknown>;
    order?: Record<string, "ASC" | "DESC">;
    relations?: string[];
  }): Promise<NotificationSettings[]> {
    return this.repository.find(options);
  }

  /**
   * Находит все включенные настройки с загруженными пользователями.
   *
   * @returns Массив включенных настроек с пользователями
   */
  findEnabledWithUserRelations(): Promise<NotificationSettings[]> {
    return this.repository.find({
      where: { enabled: true },
      relations: ["user"],
    });
  }
}
