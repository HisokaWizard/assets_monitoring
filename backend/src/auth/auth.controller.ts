/**
 * @fileoverview Контроллер аутентификации.
 *
 * Этот файл определяет REST API endpoints для регистрации и входа пользователей.
 * Контроллер обрабатывает HTTP POST запросы и делегирует бизнес-логику сервису.
 *
 * @Controller('auth') создает префикс '/auth' для всех маршрутов.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthGuard } from "@nestjs/passport";
import type { Request as ExpressRequest } from "express";

/**
 * Контроллер для операций аутентификации.
 *
 * Предоставляет endpoints для регистрации и входа пользователей.
 * Все маршруты имеют префикс '/auth'.
 *
 * @Controller декоратор регистрирует класс как контроллер с путем 'auth'.
 */
@ApiTags("auth")
@Controller("auth")
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
  @ApiBearerAuth()
  @ApiOperation({ summary: "Получить текущего пользователя" })
  @ApiResponse({ status: 200, description: "Данные пользователя" })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  getMe(@Req() req: ExpressRequest & { user: { id: number } }) {
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
  @ApiOperation({ summary: "Регистрация нового пользователя" })
  @ApiResponse({ status: 201, description: "Пользователь создан" })
  @ApiResponse({ status: 409, description: "Email уже существует" })
  @Post("register")
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
  @ApiOperation({ summary: "Вход в систему" })
  @ApiResponse({ status: 200, description: "JWT токен" })
  @ApiResponse({ status: 401, description: "Неверные учётные данные" })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Сбросить роль всех пользователей на 'user'.
   */
  @ApiBearerAuth()
  @ApiOperation({ summary: "Сбросить роли всех пользователей" })
  @ApiResponse({ status: 201, description: "Роли сброшены" })
  @ApiResponse({ status: 401, description: "Не авторизован" })
  @Post("admin/reset-roles")
  @UseGuards(AuthGuard("jwt"))
  resetRoles() {
    return this.authService.resetAllUserRoles();
  }
}
