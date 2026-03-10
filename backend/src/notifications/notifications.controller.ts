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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
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
@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Отправка уведомления (для совместимости).
   */
  @ApiOperation({ summary: "Отправить уведомление" })
  @ApiResponse({ status: 201, description: "Уведомление отправлено" })
  @Post("send")
  send(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendNotification(sendNotificationDto);
  }

  /**
   * Получить настройки уведомлений пользователя.
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить настройки уведомлений" })
  @ApiResponse({ status: 200, description: "Список настроек" })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @Get("settings")
  @UseGuards(AuthGuard("jwt"))
  getSettings(@Request() req: AuthRequest) {
    return this.notificationsService.getUserSettings(req.user.id);
  }

  /**
   * Создать настройку уведомлений.
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: "Создать настройку уведомлений" })
  @ApiResponse({ status: 201, description: "Настройка создана" })
  @ApiResponse({ status: 401, description: "Не авторизован" })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: "Обновить настройку уведомлений" })
  @ApiParam({ name: "id", type: Number, description: "ID настройки" })
  @ApiResponse({ status: 200, description: "Настройка обновлена" })
  @ApiResponse({ status: 404, description: "Настройка не найдена" })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: "Удалить настройку уведомлений" })
  @ApiParam({ name: "id", type: Number, description: "ID настройки" })
  @ApiResponse({ status: 200, description: "Настройка удалена" })
  @ApiResponse({ status: 404, description: "Настройка не найдена" })
  @Delete("settings/:id")
  @UseGuards(AuthGuard("jwt"))
  deleteSettings(@Request() req: AuthRequest, @Param("id") id: number) {
    return this.notificationsService.deleteSettings(+id, req.user.id);
  }

  /**
   * Получить исторические цены актива.
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить историю цен актива" })
  @ApiParam({ name: "id", type: Number, description: "ID актива" })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Лимит записей (по умолчанию 100)",
  })
  @ApiResponse({ status: 200, description: "История цен" })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: "Сгенерировать отчёт по портфелю" })
  @ApiResponse({ status: 201, description: "Отчёт сгенерирован" })
  @Post("reports/generate")
  @UseGuards(AuthGuard("jwt"))
  generateReport(@Request() req: AuthRequest, @Body() dto: GenerateReportDto) {
    return this.notificationsService.generateReport(req.user.id, dto);
  }

  /**
   * Ручной запуск обновления активов и уведомлений.
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: "Ручной запуск обновления активов и уведомлений" })
  @ApiResponse({ status: 201, description: "Обновление запущено" })
  @Post("assets/update")
  @UseGuards(AuthGuard("jwt"))
  triggerAssetUpdatesAndNotifications() {
    return this.notificationsService.triggerAssetUpdatesAndNotifications();
  }

  /**
   * Получить логи уведомлений.
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить логи уведомлений" })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Лимит записей (по умолчанию 50)",
  })
  @ApiResponse({ status: 200, description: "Логи уведомлений" })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: "Очистить дубликаты настроек" })
  @ApiResponse({ status: 201, description: "Дубликаты удалены" })
  @Post("settings/cleanup")
  @UseGuards(AuthGuard("jwt"))
  cleanupSettings(@Request() req: AuthRequest) {
    return this.notificationsService.cleanupDuplicateSettings(req.user.id);
  }
}
