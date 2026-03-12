/**
 * @fileoverview Кастомный репозиторий для работы с сущностью User.
 *
 * Инкапсулирует логику доступа к данным пользователей.
 * Абстрагирует TypeORM Repository и предоставляет типизированные методы
 * для поиска, создания и обновления пользователей.
 */

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";
import { UserRole } from "./user-role.enum";

/**
 * Репозиторий для работы с пользователями.
 *
 * Предоставляет методы для CRUD-операций над сущностью User.
 * Используется в AuthService для отделения бизнес-логики от доступа к данным.
 *
 * @Injectable регистрирует класс в контейнере зависимостей NestJS.
 */
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Найти пользователя по идентификатору.
   *
   * @param id - Уникальный идентификатор пользователя.
   * @returns Promise с найденным пользователем или null, если не найден.
   */
  async findOneById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Найти пользователя по email.
   *
   * @param email - Email пользователя для поиска.
   * @returns Promise с найденным пользователем или null, если не найден.
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  /**
   * Создать и сохранить нового пользователя.
   *
   * Создаёт экземпляр сущности User из переданных данных
   * и сохраняет его в базу данных.
   *
   * @param data - Частичные данные для создания пользователя.
   * @returns Promise с сохранённой сущностью User.
   */
  async createAndSave(data: Partial<User>): Promise<User> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Обновить роль всех пользователей.
   *
   * Выполняет массовое обновление роли для всех записей в таблице пользователей.
   *
   * @param role - Новая роль для всех пользователей.
   * @returns Promise с количеством обновлённых записей.
   */
  async updateAllRoles(role: UserRole): Promise<number> {
    const result = await this.repository.update({}, { role });
    return result.affected ?? 0;
  }

  /**
   * Сохранить пользователя.
   *
   * @param user - Пользователь для сохранения.
   * @returns Promise с сохранённым пользователем.
   */
  async save(user: Partial<User>): Promise<User> {
    return this.repository.save(user);
  }
}
