import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserSettings } from "./entities/user-settings.entity";

@Injectable()
export class UserSettingsRepository {
  constructor(
    @InjectRepository(UserSettings)
    private readonly repository: Repository<UserSettings>,
  ) {}

  /**
   * Найти настройки по userId.
   */
  findOneByUserId(userId: number): Promise<UserSettings | null> {
    return this.repository.findOne({ where: { userId } });
  }

  /**
   * Создать и сохранить настройки.
   */
  createAndSave(data: Partial<UserSettings>): Promise<UserSettings> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Обновить настройки по userId.
   */
  async updateByUserId(
    userId: number,
    data: Partial<UserSettings>,
  ): Promise<void> {
    await this.repository.update({ userId }, data);
  }
}
