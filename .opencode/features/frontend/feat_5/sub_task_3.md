# Sub-task 3: Добавление функционала logout

## Описание

Интегрировать logout в карточку на HomePage. При клике на "Logout":
1. Очистить состояние auth (использовать существующий `logout` из authSlice)
2. Удалить токен из localStorage
3. Перенаправить на страницу /login

## Способ решения

Использовать хук `useDispatch` и `useNavigate` из react-router-dom:
- Импортировать `logout` из `features/auth`
- При клике вызвать `dispatch(logout())`
- Вызвать `navigate('/login', { replace: true })`

## Подготовка тесткейсов для TDD

### unit-тесты для logout functionality
- [ ] Клик на Logout вызывает dispatch с экшеном logout
- [ ] Клик на Logout вызывает navigate с '/login'
- [ ] Logout карточка имеет иконку выхода

## Ожидаемый результат

Карточка Logout функциональна
При клике пользователь выходит из системы
Происходит редирект на /login
