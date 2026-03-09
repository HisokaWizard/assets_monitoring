/**
 * @fileoverview Контроллер уведомлений.
 *
 * Этот файл определяет REST API endpoint для отправки уведомлений.
 * Контроллер принимает HTTP запросы и делегирует обработку сервису.
 *
 * @Controller('notifications') создает префикс '/notifications' для маршрутов.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { NotificationsService } from "./notifications.service";
import { SendNotificationDto } from "./core/dto/send-notification.dto";
import { CreateNotificationSettingsDto } from "./core/dto/create-notification-settings.dto";
import { UpdateNotificationSettingsDto } from "./core/dto/update-notification-settings.dto";
import { GenerateReportDto } from "./core/dto/generate-report.dto";

interface AuthRequest {
  user: {
    id: number;
    email?: string;
  };
}

/**
 * Контроллер для операций с уведомлениями.
 *
 * Предоставляет API для отправки уведомлений пользователям.
 * Все маршруты имеют префикс '/notifications'.
 *
 * @Controller декоратор регистрирует класс как контроллер.
 */
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Отправка уведомления (для совместимости).
   */
  @Post("send")
  send(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendNotification(sendNotificationDto);
  }

  /**
   * Получить настройки уведомлений пользователя.
   */
  @Get("settings")
  @UseGuards(AuthGuard("jwt"))
  getSettings(@Request() req: AuthRequest) {
    return this.notificationsService.getUserSettings(req.user.id);
  }

  /**
   * Создать настройку уведомлений.
   */
  @Post("settings")
  @UseGuards(AuthGuard("jwt"))
  createSettings(
    @Request() req: AuthRequest,
    @Body() dto: CreateNotificationSettingsDto,
  ) {
    return this.notificationsService.createSettings(req.user.id, dto);
  }

  /**
   * Обновить настройку уведомлений.
   */
  @Put("settings/:id")
  @UseGuards(AuthGuard("jwt"))
  updateSettings(
    @Request() req: AuthRequest,
    @Param("id") id: number,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.notificationsService.updateSettings(+id, req.user.id, dto);
  }

  /**
   * Удалить настройку уведомлений.
   */
  @Delete("settings/:id")
  @UseGuards(AuthGuard("jwt"))
  deleteSettings(@Request() req: AuthRequest, @Param("id") id: number) {
    return this.notificationsService.deleteSettings(+id, req.user.id);
  }

  /**
   * Получить исторические цены актива.
   */
  @Get("assets/:id/history")
  @UseGuards(AuthGuard("jwt"))
  getAssetHistory(
    @Param("id") assetId: number,
    @Query("limit") limit?: number,
  ) {
    return this.notificationsService.getAssetHistory(
      +assetId,
      limit ? +limit : 100,
    );
  }

  /**
   * Сгенерировать отчет.
   */
  @Post("reports/generate")
  @UseGuards(AuthGuard("jwt"))
  generateReport(@Request() req: AuthRequest, @Body() dto: GenerateReportDto) {
    return this.notificationsService.generateReport(req.user.id, dto);
  }

  /**
   * Ручной запуск обновления активов и уведомлений.
   */
  @Post("assets/update")
  @UseGuards(AuthGuard("jwt"))
  triggerAssetUpdatesAndNotifications() {
    return this.notificationsService.triggerAssetUpdatesAndNotifications();
  }

  /**
   * Получить логи уведомлений.
   */
  @Get("logs")
  @UseGuards(AuthGuard("jwt"))
  getLogs(@Request() req: AuthRequest, @Query("limit") limit?: number) {
    return this.notificationsService.getNotificationLogs(
      req.user.id,
      limit ? +limit : 50,
    );
  }

  /**
   * Очистить дубликаты настроек.
   */
  @Post("settings/cleanup")
  @UseGuards(AuthGuard("jwt"))
  cleanupSettings(@Request() req: AuthRequest) {
    return this.notificationsService.cleanupDuplicateSettings(req.user.id);
  }
}
