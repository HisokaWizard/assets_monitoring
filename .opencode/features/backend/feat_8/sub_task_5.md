# sub_task_5: Интеграция в generateUserPeriodicReport

## Описание

Обновить `generateUserPeriodicReport` и `sendReportEmail` в `ReportsService`:
1. Перед генерацией — проверить `hasEnoughHistory` и `canSendReport`
2. Передавать HTML в `emailService.sendEmail(email, subject, plainText, html)`
3. После успешной отправки — сохранять запись в `ReportLog`
4. Расширить `reportData` items полем `lastPrice` и `assetType` + `nativeToken`

## Изменения в generateUserPeriodicReport

```typescript
private async generateUserPeriodicReport(userId: number, period: string): Promise<void> {
  // 1. Проверка исторических данных
  const hasHistory = await this.hasEnoughHistory(userId, period);
  if (!hasHistory) {
    this.logger.log(`Not enough historical data for ${period} report, user ${userId}`);
    return;
  }

  // 2. Проверка уникальности
  const canSend = await this.canSendReport(userId, period);
  if (!canSend) {
    this.logger.log(`${period} report already sent recently for user ${userId}`);
    return;
  }

  // ... (существующая логика получения активов и вычисления изменений)

  // reportData теперь включает lastPrice, assetType, nativeToken, fullName
  reportData.push({
    assetType: asset.type,
    name,
    fullName: asset instanceof CryptoAsset ? asset.fullName : undefined,
    nativeToken: asset instanceof NFTAsset ? (asset as NFTAsset).nativeToken : undefined,
    lastPrice,       // null если первый отчёт
    currentPrice,
    change,
    totalValue,
  });

  // ...
}
```

## Изменения в sendReportEmail

```typescript
private async sendReportEmail(...): Promise<void> {
  const subject = `Portfolio ${periodLabel} Report`;
  const plainText = this.buildReportMessage(reportData, period);
  const html = this.buildReportHtml(reportData, period);

  const success = await this.emailService.sendEmail(user.email, subject, plainText, html);

  // Логируем в NotificationLog (существующий)
  await this.logRepository.save({ ... });

  // Сохраняем в ReportLog (новый) — только если sent
  if (success) {
    await this.reportLogRepository.save({
      userId: user.id,
      period,
      sentAt: new Date(),
      status: 'sent',
    });
  }
}
```

## Тесткейсы для TDD

### TC-1: Полная интеграция — отправка блокируется при отсутствии истории
```
Arrange: hasEnoughHistory returns false
Act: generateUserPeriodicReport(userId, 'daily')
Assert: emailService.sendEmail НЕ вызывается
Assert: reportLogRepository.save НЕ вызывается
```

### TC-2: Полная интеграция — отправка блокируется при недавнем отчёте
```
Arrange: hasEnoughHistory=true, canSendReport=false
Act: generateUserPeriodicReport(userId, 'daily')
Assert: emailService.sendEmail НЕ вызывается
```

### TC-3: Успешная отправка — сохраняется ReportLog
```
Arrange: hasEnoughHistory=true, canSendReport=true, emailService returns true
Act: generateUserPeriodicReport(userId, 'daily')
Assert: reportLogRepository.save вызывается с { userId, period: 'daily', status: 'sent' }
Assert: emailService.sendEmail вызывается с 4 аргументами (text + html)
```

### TC-4: Неудачная отправка — ReportLog НЕ сохраняется (чтобы не блокировать следующую попытку)
```
Arrange: emailService returns false
Act: generateUserPeriodicReport(userId, 'daily')
Assert: reportLogRepository.save НЕ вызывается с 'sent'
```

### TC-5: HTML содержит lastPrice из asset.dailyPrice
```
Arrange: asset.dailyPrice = 48000, asset.currentPrice = 50000
Act: генерация daily отчёта
Assert: html письма содержит '48' и '50' (цены в таблице)
```

## Регистрация в модуле

- `reports.module.ts`: добавить `ReportLog` в `TypeOrmModule.forFeature([...])`
- `reports.module.ts`: добавить `HistoricalPrice` в `TypeOrmModule.forFeature([...])`
- Экспорт ReportLog entity: добавить в app.module.ts entities если нет auto-discovery

## Ожидаемый результат

- `generateUserPeriodicReport` использует оба фильтра перед отправкой
- Email отправляется с HTML (4-й аргумент)
- После успешной отправки — запись в report_log

## Критерии приёмки

- Все 5 TC зелёные
- Существующие тесты reports.service.spec.ts адаптированы и зелёные
- Логика работает end-to-end при вызове scheduler
