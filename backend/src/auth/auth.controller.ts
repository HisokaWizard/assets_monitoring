/**
 * @fileoverview Контроллер аутентификации.
 *
 * Этот файл определяет REST API endpoints для регистрации и входа пользователей.
 * Контроллер обрабатывает HTTP POST запросы и делегирует бизнес-логику сервису.
 *
 * @Controller('auth') создает префикс '/auth' для всех маршрутов.
 */

import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

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
   * Получить текущего пользователя.
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

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
   * @HttpCode(HttpStatus.OK) возвращает статус 200 вместо 201.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Сбросить роль всех пользователей на 'user'.
   */
  @Post('admin/reset-roles')
  @UseGuards(AuthGuard('jwt'))
  resetRoles() {
    return this.authService.resetAllUserRoles();
  }
}
