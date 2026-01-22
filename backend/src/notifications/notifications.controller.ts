/**
 * @fileoverview Контроллер уведомлений.
 *
 * Этот файл определяет REST API endpoint для отправки уведомлений.
 * Контроллер принимает HTTP запросы и делегирует обработку сервису.
 *
 * @Controller('notifications') создает префикс '/notifications' для маршрутов.
 */

import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';

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
  /**
   * Конструктор контроллера.
   *
   * @param notificationsService Сервис для обработки уведомлений.
   */
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Отправка уведомления.
   *
   * @param sendNotificationDto Данные уведомления из тела запроса.
   * @returns Результат отправки уведомления.
   * @Post('send') обрабатывает POST запросы на '/notifications/send'.
   * @Body извлекает данные из тела HTTP запроса.
   */
  @Post('send')
  send(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendNotification(sendNotificationDto);
  }
}
