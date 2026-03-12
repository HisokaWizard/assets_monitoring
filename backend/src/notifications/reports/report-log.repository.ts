import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReportLog } from "./report-log.entity";

/**
 * Репозиторий для работы с логами отчетов.
 *
 * Инкапсулирует CRUD операции и запросы к таблице report_log.
 */
@Injectable()
export class ReportLogRepository {
  constructor(
    @InjectRepository(ReportLog)
    private readonly repository: Repository<ReportLog>,
  ) {}

  /**
   * Находит последний отправленный отчет по ID пользователя и периоду.
   *
   * @param userId ID пользователя
   * @param period Период отчета (daily, weekly, monthly, quarterly, yearly)
   * @returns Последний отчет или null
   */
  findLastByUserIdAndPeriod(
    userId: number,
    period: string,
  ): Promise<ReportLog | null> {
    return this.repository.findOne({
      where: { userId, period },
      order: { sentAt: "DESC" },
    });
  }

  /**
   * Сохраняет новую запись лога отчета.
   *
   * @param data Данные для создания записи
   * @returns Сохраненная запись
   */
  saveLog(data: Partial<ReportLog>): Promise<ReportLog> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
