# Соревновательный филворд

MVP веб-приложения по `spec.md`: общий матч, поле 10x10, игроки, таймер,
серверная проверка слов и обновление состояния через polling.

## Стек

- Next.js App Router
- TypeScript
- Drizzle ORM
- SQLite/libSQL через `@libsql/client`
- BetterAuth

Игровые данные теперь сохраняются в SQLite-файл `local.db` по умолчанию. BetterAuth
подключен к той же Drizzle-схеме и доступен через `/api/auth/[...all]`.
Профиль пользователя хранит имя и avatar data URL в таблице `user`.

## Переменные окружения

Можно создать `.env.local`:

```bash
DATABASE_URL=file:local.db
BETTER_AUTH_SECRET=replace-with-long-random-secret
BETTER_AUTH_URL=http://localhost:3000
```

Если `DATABASE_URL` не задан, приложение использует `file:local.db`.

## Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000/auth](http://localhost:3000/auth), создайте
аккаунт или войдите, затем приложение перенаправит в лобби `/`.

Таблицы создаются автоматически при первом обращении к API. Для работы через
Drizzle Kit доступны команды:

```bash
npm run db:generate
npm run db:push
npm run db:studio
```

## Игровой сценарий

1. На главной странице выберите игру с ботом или мультиплеер.
2. Для мультиплеера создайте комнату на 2 или 3 игроков.
3. Второй игрок выбирает комнату в списке активных комнат.
4. Когда комната заполнена, матч стартует автоматически.
5. Выделяйте соседние клетки слова и отправляйте выбор.

Бот в одиночном режиме ходит с задержкой и не обгоняет игрока по счету.
Активные комнаты отображаются на игровых страницах и скрыты на странице входа.

## Основные файлы

- `src/server/db/schema.ts` - Drizzle-схема BetterAuth и игры.
- `src/server/db/client.ts` - libSQL/Drizzle client и bootstrap таблиц.
- `src/lib/auth.ts` - конфигурация BetterAuth.
- `src/server/auth.ts` - чтение текущей сессии на сервере.
- `src/app/auth/page.tsx` - страница входа и регистрации.
- `src/app/auth/AuthForm.tsx` - клиентская форма login/register.
- `src/app/LobbyClient.tsx` - лобби, выбор режима и список комнат.
- `src/app/ActiveRoomsList.tsx` - общий список активных комнат.
- `src/app/GlobalRoomsDock.tsx` - список комнат на страницах вне регистрации.
- `src/app/match/[matchId]/page.tsx` - комната ожидания.
- `src/app/api/auth/[...all]/route.ts` - BetterAuth Next.js route.
- `src/app/api/lobby/route.ts` - API комнат и matchmaking.
- `src/app/api/profile/route.ts` - обновление имени и аватара.
- `src/app/api/match/route.ts` - API матча.
- `src/server/services/lobby.service.ts` - создание комнат, join и bot match.
- `src/server/services/game.service.ts` - жизненный цикл матча в БД.
- `src/server/services/grid.service.ts` - генерация поля 10x10.
- `src/server/services/word.service.ts` - серверная проверка слова.
