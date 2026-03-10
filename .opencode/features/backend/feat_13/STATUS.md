# Status: feat_13

- **Current:** done
- **Started:** 2026-03-09 11:00
- **Completed:** 2026-03-09 12:00
- **Current Sub-task:** —

## Описание
Swagger/OpenAPI документация — установка, настройка и добавление декораторов ко всем модулям backend

## Прогресс

- [x] sub_task_1.md — Инфраструктура Swagger (установка + настройка SwaggerModule)
- [x] sub_task_2.md — Swagger-декораторы для Auth модуля
- [x] sub_task_3.md — Swagger-декораторы для Assets модуля
- [x] sub_task_4.md — Swagger-декораторы для Notifications модуля
- [x] sub_task_5.md — Swagger-декораторы для UserSettings модуля

## Результат

- **Build:** 0 ошибок ✅
- **Tests:** 171 passed, 15 test suites ✅

## Изменённые файлы

### Инфраструктура
- `backend/package.json` — добавлен `@nestjs/swagger@7.4.2`
- `backend/src/main.ts` — настроен SwaggerModule, Swagger UI по `/api/docs`

### Auth модуль (4 файла)
- `backend/src/auth/auth.controller.ts` — @ApiTags, @ApiOperation, @ApiResponse, @ApiBearerAuth
- `backend/src/auth/dto/register.dto.ts` — @ApiProperty
- `backend/src/auth/dto/login.dto.ts` — @ApiProperty
- `backend/src/auth/user.entity.ts` — @ApiProperty, @ApiHideProperty, @ApiPropertyOptional

### Assets модуль (5 файлов)
- `backend/src/assets/assets.controller.ts` — @ApiTags, @ApiBearerAuth, @ApiOperation, @ApiResponse, @ApiParam
- `backend/src/assets/dto/create-asset.dto.ts` — @ApiProperty, @ApiPropertyOptional
- `backend/src/assets/dto/update-asset.dto.ts` — PartialType заменён на @nestjs/swagger
- `backend/src/assets/asset.entity.ts` — @ApiProperty, @ApiPropertyOptional, @ApiHideProperty
- `backend/src/assets/historical-price.entity.ts` — @ApiProperty, @ApiHideProperty

### Notifications модуль (8 файлов)
- `backend/src/notifications/notifications.controller.ts` — @ApiTags, @ApiOperation, @ApiResponse, @ApiBearerAuth, @ApiParam, @ApiQuery
- `backend/src/notifications/core/dto/send-notification.dto.ts` — @ApiProperty
- `backend/src/notifications/core/dto/create-notification-settings.dto.ts` — @ApiProperty, @ApiPropertyOptional
- `backend/src/notifications/core/dto/update-notification-settings.dto.ts` — PartialType заменён на @nestjs/swagger
- `backend/src/notifications/core/dto/generate-report.dto.ts` — @ApiPropertyOptional
- `backend/src/notifications/core/entities/notification-settings.entity.ts` — @ApiProperty, @ApiPropertyOptional, @ApiHideProperty
- `backend/src/notifications/core/entities/notification-log.entity.ts` — @ApiProperty, @ApiHideProperty
- `backend/src/notifications/reports/report-log.entity.ts` — @ApiProperty, @ApiHideProperty

### UserSettings модуль (4 файлов)
- `backend/src/user-settings/user-settings.controller.ts` — @ApiTags, @ApiBearerAuth, @ApiOperation, @ApiResponse
- `backend/src/user-settings/core/dto/create-user-settings.dto.ts` — @ApiPropertyOptional
- `backend/src/user-settings/core/dto/update-user-settings.dto.ts` — @ApiPropertyOptional
- `backend/src/user-settings/core/entities/user-settings.entity.ts` — @ApiProperty, @ApiPropertyOptional, @ApiHideProperty
