# Feature 5: Home Page Navigation Cards

## Описание

Создание навигационных карточек на странице home с маршрутизацией на соответствующие страницы: NFTs, Tokens, Profile. Также добавить функционал logout.

## Контекст

- **Стек**: React 18+, TypeScript 5+, Material UI 7, React Router 6, Redux Toolkit
- **Архитектура**: FSD (Feature-Sliced Design)
- **Страницы**: Используем паттерн `pages/{name}/{PageName}.tsx` + `index.ts`
- **Роутинг**: React Router 6 с ProtectedRoute
- **Тестирование**: Jest + React Testing Library

## Декомпозиция

### Sub-task 1: Создание страниц-заготовок
Создать пустые страницы-заготовки для NFT, Tokens и Profile.

- **Сложность**: Low
- **Зависимости**: Нет

### Sub-task 2: Обновление HomePage с навигационными карточками
Добавить на HomePage навигационные карточки (MUI Card) со ссылками на NFT, Tokens, Profile.

- **Сложность**: Medium
- **Зависимости**: Sub-task 1 (нужны маршруты)

### Sub-task 3: Добавление функционала logout
Интегрировать logout в навигационные карточки или добавить кнопку выхода.

- **Сложность**: Low
- **Зависимости**: Sub-task 2

### Sub-task 4: Обновление роутера
Добавить маршруты для /nfts, /tokens, /profile в router.

- **Сложность**: Low
- **Зависимости**: Sub-task 1

### Sub-task 5: Написание тестов
Написать unit-тесты для новых страниц и компонентов.

- **Сложность**: Medium
- **Зависимости**: Sub-task 1-4

## Ожидаемый результат

- HomePage отображает 4 навигационные карточки: NFTs, Tokens, Profile, Logout
- Каждая карточка ведет на соответствующую страницу
- Страницы /nfts, /tokens, /profile существуют как пустые заготовки
- Logout очищает состояние auth и редиректит на /login
- Все тесты проходят
