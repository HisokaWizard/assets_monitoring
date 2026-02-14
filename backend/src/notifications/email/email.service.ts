/**
 * @fileoverview Сервис для отправки email уведомлений.
 *
 * Этот файл содержит логику для отправки email через nodemailer с Yandex SMTP.
 * Предоставляет методы для отправки уведомлений пользователям.
 */

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Сервис для отправки email.
 *
 * Настраивает транспортер nodemailer с Yandex SMTP и предоставляет
 * метод для отправки email уведомлений.
 *
 * @Injectable регистрирует класс как провайдер в контейнере зависимостей.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Инициализация транспортера nodemailer.
   *
   * Настраивает SMTP подключение к Yandex.
   * Использует переменные окружения для конфигурации.
   */
  private initializeTransporter() {
    const host = process.env.YANDEX_SMTP_HOST || 'smtp.yandex.com';
    const port = parseInt(process.env.YANDEX_SMTP_PORT || '587');
    const user = process.env.YANDEX_SMTP_USER;
    const pass = process.env.YANDEX_SMTP_PASS;

    if (!user || !pass) {
      this.logger.warn('Yandex SMTP credentials not configured');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter initialized');
  }

  /**
   * Отправка email уведомления.
   *
   * @param to Email адрес получателя
   * @param subject Тема письма
   * @param message Текст сообщения
   * @returns Promise<boolean> Успешность отправки
   */
  async sendEmail(to: string, subject: string, message: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.YANDEX_SMTP_USER,
        to,
        subject,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }
}
