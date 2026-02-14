/**
 * @fileoverview DTO для обновления настроек уведомлений.
 *
 * Этот файл определяет структуру данных для обновления настроек уведомлений.
 * Все поля опциональны.
 */

import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationSettingsDto } from './create-notification-settings.dto';

/**
 * DTO для обновления настроек уведомлений.
 *
 * Наследует от CreateNotificationSettingsDto, делая все поля опциональными.
 */
export class UpdateNotificationSettingsDto extends PartialType(CreateNotificationSettingsDto) {}
