# Sub-task 1: Создание Entity UserSettings

## Описание

Создать TypeORM entity `UserSettings` для хранения API-ключей пользователя. Entity должен иметь связь ManyToOne с User и поля для API-ключей CoinMarketCap и OpenSea.

## Способ решения

### Структура файла

Создать `backend/src/user-settings/core/entities/user-settings.entity.ts`:

```typescript
/**
 * @fileoverview Сущность настроек API пользователя.
 *
 * Хранит API-ключи для внешних сервисов (CoinMarketCap, OpenSea).
 * Связана с пользователем отношением ManyToOne.
 */

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../../auth/user.entity';

/**
 * Сущность настроек API пользователя.
 *
 * @Entity декоратор указывает, что класс соответствует таблице в БД.
 */
@Entity('user_settings')
export class UserSettings {
  /**
   * Уникальный идентификатор настроек.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * ID пользователя.
   */
  @Column()
  userId: number;

  /**
   * Связь с пользователем.
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * API-ключ CoinMarketCap.
   * Хранится в зашифрованном виде.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  coinmarketcapApiKey?: string;

  /**
   * API-ключ OpenSea.
   * Хранится в зашифрованном виде.
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  openseaApiKey?: string;

  /**
   * Дата создания записи.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Дата последнего обновления.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Миграция БД

TypeORM автоматически создаст таблицу при синхронизации или нужно создать миграцию:

```sql
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "coinmarketcapApiKey" VARCHAR(500),
  "openseaApiKey" VARCHAR(500),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_user_settings_user_id ON user_settings("userId");
```

## Подготовка тесткейсов для TDD

### Unit-тесты для Entity

1. **Entity definition**
   - Тест: класс UserSettings определен
   - Тест: имеет декоратор @Entity

2. **Columns definition**
   - Тест: поле id имеет @PrimaryGeneratedColumn
   - Тест: поле userId имеет @Column
   - Тест: поля coinmarketcapApiKey и openseaApiKey nullable
   - Тест: поля createdAt и updatedAt имеют @CreateDateColumn/@UpdateDateColumn

3. **Relations**
   - Тест: имеет ManyToOne связь с User
   - Тест: связь настроена на CASCADE delete

### Интеграционные тесты

4. **Database schema**
   - Тест: таблица создается корректно
   - Тест: внешний ключ userId работает
   - Тест: уникальный индекс на userId

## Ожидаемый результат

- Файл `user-settings/core/entities/user-settings.entity.ts` создан
- Entity имеет все необходимые поля
- Связь ManyToOne с User настроена с onDelete: 'CASCADE'
- Тесты покрывают структуру entity

## Критерии приёмки

- [ ] Entity создан согласно спецификации
- [ ] Все поля имеют правильные типы и декораторы
- [ ] Связь с User настроена корректно
- [ ] JSDoc документация присутствует
- [ ] Unit-тесты проходят
