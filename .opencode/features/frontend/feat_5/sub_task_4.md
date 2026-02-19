# Sub-task 4: Обновление роутера

## Описание

Добавить маршруты для /nfts, /tokens, /profile в router.

## Способ решения

Добавить новые маршруты в `frontend/src/app/router/index.tsx`:
- /nfts → NftsPage
- /tokens → TokensPage
- /profile → ProfilePage

Все новые маршруты должны быть защищены ProtectedRoute.

## Подготовка тесткейсов для TDD

### Тесты роутера
- [ ] Маршрут /nfts ведет на NftsPage
- [ ] Маршрут /tokens ведет на TokensPage
- [ ] Маршрут /profile ведет на ProfilePage

## Ожидаемый результат

Маршруты добавлены в router
Страницы доступны только авторизованным пользователям
