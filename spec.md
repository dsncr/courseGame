# 📘 SPECIFICATION DOCUMENT

## Веб-приложение: «Соревновательный филворд с общим словарным полем»

---

# 1. 📌 Общая информация

## 1.1 Цель проекта

Разработка клиент-серверного веб-приложения, реализующего многопользовательскую игру «филворд» (поиск слов в сетке букв) с синхронизацией в реальном времени.

## 1.2 Технологический стек

* TypeScript
* Next.js (App Router)
* tRPC (API слой)
* Drizzle ORM (работа с БД)
* better-auth (аутентификация)
* WebSocket (реалтайм)

---

# 2. 🧱 Архитектура системы

## 2.1 Общая схема

Client (Next.js UI)
↓ tRPC
Server (Next.js API / tRPC routers)
↓
Database (PostgreSQL / SQLite)

## 2.2 Принципы

* Вся бизнес-логика на сервере
* Клиент только отображает состояние
* Сервер является единственным источником истины (SSOT)

---

# 3. 🗂 Структура проекта

```
/src
  /app
    /game
      page.tsx
      GameGrid.tsx
      ScoreBoard.tsx
      Timer.tsx
  /server
    /routers
      match.ts
      player.ts
    /services
      game.service.ts
      word.service.ts
      grid.service.ts
    /db
      schema.ts
      client.ts
    /realtime
      ws.ts
  /lib
    auth.ts
    utils.ts
```

---

# 4. 🧩 Сущности и модели данных

## 4.1 User

```
User {
  id: string
  name: string
  createdAt: Date
}
```

## 4.2 Match

```
Match {
  id: string
  status: "waiting" | "playing" | "finished"
  createdAt: Date
  startedAt: Date | null
  duration: number
}
```

## 4.3 Player

```
Player {
  id: string
  userId: string
  matchId: string
  score: number
  color: string
}
```

## 4.4 Word

```
Word {
  id: string
  matchId: string
  value: string
  foundBy: string | null
  foundAt: Date | null
}
```

## 4.5 Grid

```
Grid {
  matchId: string
  cells: string[][] // 10x10
}
```

---

# 5. 🎮 Игровая логика

## 5.1 Генерация поля

### Вход:

* список слов

### Алгоритм:

1. Создать пустую сетку 10x10
2. Для каждого слова:

   * выбрать случайное направление (→ ↓ ↘)
   * попытаться разместить
   * при конфликте — повторить
3. Заполнить пустые клетки случайными буквами

### Выход:

* grid
* список слов

---

## 5.2 Проверка слова

### Вход:

* слово
* координаты

### Проверки:

* слово существует в словаре матча
* слово не найдено ранее
* координаты соответствуют слову

### Выход:

* success | error

---

## 5.3 Подсчет очков

* +1 за каждое найденное слово
* при равенстве — учитывать время нахождения

---

## 5.4 Завершение матча

Матч завершается при:

* истечении времени

Победитель:

* максимальный score
* при равенстве — быстрее нашёл слова

---

# 6. 🔌 API (tRPC)

## matchRouter

### createMatch

```
input: {}
output: { matchId }
```

### joinMatch

```
input: { matchId }
output: { playerId }
```

### startMatch

```
input: { matchId }
output: { success }
```

### getState

```
input: { matchId }
output: GameState
```

### submitWord

```
input: {
  matchId,
  word,
  coordinates: { x, y }[]
}
output: { success }
```

---

# 7. ⚡ Realtime система

## 7.1 События

* MATCH_STARTED
* WORD_FOUND
* PLAYER_JOINED
* MATCH_FINISHED

## 7.2 Payload

```
GameState {
  grid
  players
  words
  timer
}
```

## 7.3 Поведение

* сервер рассылает обновления всем игрокам
* клиент подписывается на изменения

---

# 8. 🖥 Клиентская логика

## 8.1 Компоненты

### GameGrid

* отображает поле
* обработка выделения слов

### ScoreBoard

* список игроков
* очки

### Timer

* оставшееся время

---

## 8.2 UX сценарий

1. Пользователь заходит
2. Создаёт или подключается к матчу
3. Ждёт других игроков
4. Игра начинается
5. Находит слова
6. Получает результат

---

# 9. 🧪 Тестирование

## 9.1 Unit тесты

* генерация поля
* проверка слов

## 9.2 Интеграционные

* submitWord
* match lifecycle

---

# 10. 🤖 Бот (дополнительно)

## Поведение

* выбирает слово из доступных
* отправляет как игрок

## Настройки

* скорость (delay)

---

# 11. 👥 Командный режим (дополнительно)

## Team

```
Team {
  id
  matchId
  score
}
```

Игрок:

```
teamId
```

---

# 12. 🚨 Ограничения

* Максимум 6 игроков
* Поле фиксировано 10x10
* Все проверки только на сервере

---

# 13. 📈 MVP критерии

Минимально допустимо:

* 2 игрока
* базовый realtime (или polling)
* генерация поля
* проверка слов

---

# 14. 🔮 Возможные расширения

* рейтинг игроков
* история матчей
* разные размеры поля
* мобильная версия

---

# ✅ Конец спецификации
