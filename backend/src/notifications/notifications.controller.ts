/**
 * @fileoverview Контроллер уведомлений.
 *
 * Этот файл определяет REST API endpoint для отправки уведомлений.
 * Контроллер принимает HTTP запросы и делегирует обработку сервису.
 *
 * @Controller('notifications') создает префикс '/notifications' для маршрутов.
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './core/dto/send-notification.dto';
import { CreateNotificationSettingsDto } from './core/dto/create-notification-settings.dto';
import { UpdateNotificationSettingsDto } from './core/dto/update-notification-settings.dto';
import { GenerateReportDto } from './core/dto/generate-report.dto';

/**
 * Контроллер для операций с уведомлениями.
 *
 * Предоставляет API для отправки уведомлений пользователям.
 * Все маршруты имеют префикс '/notifications'.
 *
 * @Controller декоратор регистрирует класс как контроллер.
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Отправка уведомления (для совместимости).
   */
  @Post('send')
  send(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendNotification(sendNotificationDto);
  }

  /**
   * Получить настройки уведомлений пользователя.
   */
  @Get('settings')
  // @UseGuards(JwtAuthGuard)
  getSettings(/* @GetUser() user: User */) {
    // Для примера, используем userId = 1
    const userId = 1;
    return this.notificationsService.getUserSettings(userId);
  }

  /**
   * Создать настройку уведомлений.
   */
  @Post('settings')
  // @UseGuards(JwtAuthGuard)
  createSettings(/* @GetUser() user: User, */ @Body() dto: CreateNotificationSettingsDto) {
    const userId = 1;
    return this.notificationsService.createSettings(userId, dto);
  }

  /**
   * Обновить настройку уведомлений.
   */
  @Put('settings/:id')
  // @UseGuards(JwtAuthGuard)
  updateSettings(
    /* @GetUser() user: User, */
    @Param('id') id: number,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    const userId = 1;
    return this.notificationsService.updateSettings(+id, userId, dto);
  }

  /**
   * Удалить настройку уведомлений.
   */
  @Delete('settings/:id')
  // @UseGuards(JwtAuthGuard)
  deleteSettings(/* @GetUser() user: User, */ @Param('id') id: number) {
    const userId = 1;
    return this.notificationsService.deleteSettings(+id, userId);
  }

  /**
   * Получить исторические цены актива.
   */
  @Get('assets/:id/history')
  // @UseGuards(JwtAuthGuard)
  getAssetHistory(@Param('id') assetId: number, @Query('limit') limit?: number) {
    return this.notificationsService.getAssetHistory(+assetId, limit ? +limit : 100);
  }

  /**
   * Сгенерировать отчет.
   */
  @Post('reports/generate')
  // @UseGuards(JwtAuthGuard)
  generateReport(/* @GetUser() user: User, */ @Body() dto: GenerateReportDto) {
    const userId = 1;
    return this.notificationsService.generateReport(userId, dto);
  }

  /**
   * Ручной запуск обновления активов и уведомлений.
   */
  @Post('assets/update')
  // @UseGuards(JwtAuthGuard)
  triggerAssetUpdatesAndNotifications() {
    return this.notificationsService.triggerAssetUpdatesAndNotifications();
  }

  /**
   * Получить логи уведомлений.
   */
  @Get('logs')
  // @UseGuards(JwtAuthGuard)
  getLogs(/* @GetUser() user: User, */ @Query('limit') limit?: number) {
    const userId = 1;
    return this.notificationsService.getNotificationLogs(userId, limit ? +limit : 50);
  }
}
