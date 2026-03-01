# Sub-task 4: Frontend - реализовать страницу NFT

## Описание

Реализовать полноценную страницу NFT портфеля по аналогии с TokensPage.

## Решение

1. Использовать TokensPage как паттерн
2. Реализовать:
   - Таблицу с колонками: Collection, Amount, Avg Price, Floor Price, Value, Invested, P/L, %, Multiple, Prev Price, Daily %, Daily $, Weekly %, Weekly $, Monthly %, Monthly $, Quarter %, Quarter $, Year %, Year $
   - Форму добавления/редактирования NFT с полями: Collection Name, Amount, Average Purchase Price
   - Кнопки: Add NFT, Update Quotes, Generate Report с селектом периода
   - Уведомления (success/error)
   - Загрузку данных при mount (useEffect с refetch)
   - Расчетные поля: totalValue, totalInvested, profitLoss, profitLossPercent

3. Формат отображения:
   - Цены в USD
   - Проценты с +/- и 2 знаками
   - Пустые значения как '—'

## Ожидаемый результат

- Страница NFT отображает все NFT пользователя
- Можно добавить/редактировать/удалить NFT
- Работает обновление котировок
- Работает генерация отчетов

## Критерии приёмки

- [ ] Таблица отображает все поля из NFTAsset
- [ ] Форма добавления с обязательными полями: collectionName, amount, middlePrice
- [ ] При создании без цены - вызывается API для получения цены
- [ ] Работают кнопки Update Quotes и Generate Report
- [ ] Данные загружаются при открытии страницы
- [ ] Тесты проходят
