/**
 * @fileoverview DTO для отправки уведомлений.
 *
 * Этот файл определяет структуру данных для запросов на отправку уведомлений.
 * Включает валидацию email получателя, темы и текста сообщения.
 */

import { IsString, IsNotEmpty, IsEmail } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO для отправки уведомления.
 *
 * Определяет поля, необходимые для отправки email уведомления:
 * адрес получателя, тема и текст сообщения.
 */
export class SendNotificationDto {
  /**
   * Email адрес получателя.
   *
   * Должен быть валидным email адресом.
   * @IsEmail() проверяет корректность формата email.
   */
  @ApiProperty({ description: "Email получателя", example: "user@example.com" })
  @IsEmail()
  to!: string;

  /**
   * Тема уведомления.
   *
   * Должна быть непустой строкой.
   */
  @ApiProperty({
    description: "Тема уведомления",
    example: "Изменение цены BTC",
  })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  /**
   * Текст сообщения уведомления.
   *
   * Должен содержать непустой текст.
   */
  @ApiProperty({
    description: "Текст сообщения",
    example: "Цена BTC выросла на 15%",
  })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
