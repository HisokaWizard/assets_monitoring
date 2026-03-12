/**
 * @fileoverview Сервис аутентификации.
 *
 * Этот файл содержит бизнес-логику для регистрации и входа пользователей.
 * Обрабатывает хэширование паролей, генерацию JWT токенов и валидацию учетных данных.
 *
 * Сервисы инкапсулируют сложную логику и могут быть легко протестированы.
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { User } from "./user.entity";
import { UserRole } from "./user-role.enum";
import { UserRepository } from "./user.repository";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

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
   * @param userRepository Кастомный репозиторий для работы с пользователями.
   * @param jwtService Сервис для работы с JWT токенами.
   */
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Получить текущего пользователя.
   */
  async getMe(userId: number): Promise<Omit<User, "password">> {
    const user = await this.userRepository.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result as Omit<User, "password">;
  }

  /**
   * Регистрация нового пользователя.
   *
   * Хэширует пароль, создает пользователя и сохраняет в базу данных.
   *
   * @param registerDto Данные для регистрации пользователя.
   * @returns Promise с созданным пользователем (без пароля).
   * @throws Ошибка, если email уже занят.
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, "password">> {
    // Check if user with this email already exists
    const existingUser = await this.userRepository.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new BadRequestException("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const savedUser = await this.userRepository.createAndSave({
      email: registerDto.email,
      password: hashedPassword,
      role: UserRole.USER,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = savedUser;
    return result as Omit<User, "password">;
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
    const user = await this.userRepository.findOneByEmail(loginDto.email);
    if (user && (await bcrypt.compare(loginDto.password, user.password))) {
      const payload = { email: user.email, sub: user.id, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
      };
    }
    throw new UnauthorizedException("Invalid credentials");
  }

  /**
   * Сбросить роль всех пользователей на UserRole.USER.
   *
   * Обновляет роль всех пользователей в базе данных на значение по умолчанию.
   *
   * @returns Promise с количеством обновлённых записей.
   */
  async resetAllUserRoles(): Promise<{ updated: number }> {
    const updated = await this.userRepository.updateAllRoles(UserRole.USER);
    return { updated };
  }
}
