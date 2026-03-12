import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationLog } from "./entities/notification-log.entity";

/**
 * Репозиторий для работы с логами уведомлений.
 *
 * Инкапсулирует CRUD операции и запросы к таблице notification_log.
 */
@Injectable()
export class NotificationLogRepository {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly repository: Repository<NotificationLog>,
  ) {}

  /**
   * Сохраняет новую запись лога уведомления.
   *
   * @param data Данные для создания записи
   * @returns Сохраненная запись
   */
  saveLog(data: Partial<NotificationLog>): Promise<NotificationLog> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Находит логи уведомлений пользователя с ограничением количества.
   *
   * @param userId ID пользователя
   * @param limit Максимальное количество записей
   * @returns Массив логов
   */
  findByUserIdWithLimit(
    userId: number,
    limit: number,
  ): Promise<NotificationLog[]> {
    return this.repository.find({
      where: { userId },
      order: { sentAt: "DESC" },
      take: limit,
    });
  }
}
