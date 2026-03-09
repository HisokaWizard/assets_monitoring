/**
 * @fileoverview Controller для настроек пользователя.
 *
 * Предоставляет REST API для управления API-ключами пользователя.
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UserSettingsService } from "./user-settings.service";
import { CreateUserSettingsDto, UpdateUserSettingsDto } from "./core/dto";
import { UserSettings } from "./core/entities/user-settings.entity";
import { User } from "../auth/user.entity";

export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * Controller для операций с настройками пользователя.
 *
 * Все маршруты требуют аутентификации.
 * @Controller('user-settings') создает префикс '/user-settings'.
 */
@Controller("user-settings")
@UseGuards(AuthGuard("jwt"))
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  /**
   * Получить настройки текущего пользователя.
   *
   * @param req - HTTP запрос с пользователем из JWT токена
   * @returns Настройки пользователя или null
   */
  @Get()
  async getSettings(
    @Request() req: AuthenticatedRequest,
  ): Promise<UserSettings | null> {
    return this.userSettingsService.getUserSettings(req.user);
  }

  /**
   * Создать настройки для текущего пользователя.
   *
   * @param req - HTTP запрос с пользователем из JWT токена
   * @param dto - DTO с API-ключами
   * @returns Созданные настройки
   */
  @Post()
  async createSettings(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.userSettingsService.createSettings(req.user, dto);
  }

  /**
   * Обновить настройки текущего пользователя.
   *
   * @param req - HTTP запрос с пользователем из JWT токена
   * @param dto - DTO с API-ключами для обновления
   * @returns Обновленные настройки
   */
  @Patch()
  async updateSettings(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateUserSettingsDto,
  ): Promise<UserSettings> {
    return this.userSettingsService.updateSettings(req.user, dto);
  }
}
