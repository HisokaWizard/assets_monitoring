/**
 * @fileoverview Сервис аутентификации.
 *
 * Этот файл содержит бизнес-логику для регистрации и входа пользователей.
 * Обрабатывает хэширование паролей, генерацию JWT токенов и валидацию учетных данных.
 *
 * Сервисы инкапсулируют сложную логику и могут быть легко протестированы.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

/**
 * Сервис для операций аутентификации.
 *
 * Предоставляет методы для регистрации новых пользователей и входа в систему.
 * Использует bcrypt для хэширования паролей и JWT для генерации токенов доступа.
 *
 * @Injectable регистрирует класс в контейнере зависимостей.
 */
@Injectable()
export class AuthService {
  /**
   * Конструктор сервиса.
   *
   * @param usersRepository Репозиторий для работы с пользователями.
   * @param jwtService Сервис для работы с JWT токенами.
   */
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * Регистрация нового пользователя.
   *
   * Хэширует пароль, создает пользователя и сохраняет в базу данных.
   *
   * @param registerDto Данные для регистрации пользователя.
   * @returns Promise с созданным пользователем (без пароля).
   * @throws Ошибка, если email уже занят.
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  /**
   * Вход пользователя в систему.
   *
   * Проверяет учетные данные и возвращает JWT токен при успехе.
   *
   * @param loginDto Данные для входа (email и пароль).
   * @returns Promise с объектом, содержащим access_token.
   * @throws Error с сообщением 'Invalid credentials' при неверных данных.
   */
  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersRepository.findOneBy({ email: loginDto.email });
    if (user && (await bcrypt.compare(loginDto.password, user.password))) {
      const payload = { email: user.email, sub: user.id, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }
    throw new Error('Invalid credentials');
  }
}
