/**
 * @fileoverview Контроллер аутентификации.
 *
 * Этот файл определяет REST API endpoints для регистрации и входа пользователей.
 * Контроллер обрабатывает HTTP POST запросы и делегирует бизнес-логику сервису.
 *
 * @Controller('auth') создает префикс '/auth' для всех маршрутов.
 */

import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * Контроллер для операций аутентификации.
 *
 * Предоставляет endpoints для регистрации и входа пользователей.
 * Все маршруты имеют префикс '/auth'.
 *
 * @Controller декоратор регистрирует класс как контроллер с путем 'auth'.
 */
@Controller('auth')
export class AuthController {
  /**
   * Конструктор контроллера.
   *
   * @param authService Сервис аутентификации для обработки бизнес-логики.
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Регистрация нового пользователя.
   *
   * @param registerDto Данные регистрации из тела запроса.
   * @returns Созданный пользователь.
   * @Post('register') обрабатывает POST запросы на '/auth/register'.
   * @Body извлекает и валидирует данные из тела HTTP запроса.
   */
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Вход пользователя в систему.
   *
   * @param loginDto Данные входа из тела запроса.
   * @returns Объект с JWT токеном доступа.
   * @Post('login') обрабатывает POST запросы на '/auth/login'.
   */
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
