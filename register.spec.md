# 🔐 AUTHENTICATION SPECIFICATION

## Окно регистрации и входа (BetterAuth)

---

# 1. 📌 Назначение

Данный модуль отвечает за:

* регистрацию пользователя
* вход в систему
* управление сессией
* защиту приватных маршрутов

---

# 2. 🧱 Архитектура

Client (Next.js)
↓
BetterAuth API
↓
Database (users, sessions)

Принцип:

* вся логика аутентификации на сервере
* клиент только отправляет данные и отображает состояние

---

# 3. 🗂 Структура файлов

```
/src
  /app
    /auth
      page.tsx
      AuthForm.tsx
  /lib
    auth.ts
  /server
    auth.ts
```

---

# 4. 🧩 Модель данных

## User

```
User {
  id: string
  email: string
  passwordHash: string
  name: string
  createdAt: Date
}
```

## Session

```
Session {
  id: string
  userId: string
  expiresAt: Date
}
```

---

# 5. 🖥 UI: AuthForm

## 5.1 Элементы

Форма содержит:

* input: email
* input: password
* button: submit
* toggle: login/register
* error message block

---

## 5.2 Состояние компонента

```
type AuthMode = "login" | "register"
```

```
state:
- mode
- email
- password
- loading
- error
```

---

# 6. 🔄 UX сценарии

## 6.1 Регистрация

1. Пользователь выбирает режим register
2. Вводит email и password
3. Нажимает submit
4. Клиент вызывает API
5. Сервер:

   * проверяет email
   * хэширует пароль
   * создаёт пользователя
   * создаёт сессию
6. Клиент получает success
7. Редирект на /game

---

## 6.2 Вход

1. Пользователь выбирает login
2. Вводит email и password
3. Нажимает submit
4. Сервер:

   * находит пользователя
   * проверяет пароль
   * создаёт сессию
5. Редирект на /game

---

# 7. ⚙️ Серверная реализация (BetterAuth)

## 7.1 Конфигурация

```
createAuth({
  providers: [
    emailPassword({
      async authorize({ email, password }) {
        const user = await db.user.findUnique({ email })

        if (!user) throw new Error("User not found")

        const isValid = verifyPassword(password, user.passwordHash)

        if (!isValid) throw new Error("Invalid password")

        return user
      }
    })
  ]
})
```

---

# 8. 🔑 Хэширование пароля

Требования:

* использовать bcrypt

```
hash(password) -> passwordHash
verify(password, hash) -> boolean
```

---

# 9. 🔌 API контракты

## register

```
input: { email, password }
output: { success }
```

## login

```
input: { email, password }
output: { success }
```

## logout

```
input: {}
output: { success }
```

---

# 10. 🔗 Интеграция с tRPC

## Контекст

```
context = {
  user: getUserFromSession()
}
```

---

## protectedProcedure

```
if (!context.user)
  throw UNAUTHORIZED
```

---

# 11. 🔒 Защита маршрутов

## Приватные страницы

* /game
* /match

Если пользователь не авторизован:
→ redirect /auth

---

# 12. 🚪 Logout

Поведение:

* удаление сессии
* очистка cookies
* редирект

---

# 13. ⚠️ Ошибки

* user already exists
* invalid credentials
* server error

UI:

* отображение ошибки

---

# 14. 🔐 Безопасность

* httpOnly cookies
* не хранить пароль в plain text
* защита от XSS
* защита от CSRF

---

# 15. 📈 MVP

Минимум:

* регистрация
* вход
* сессия
* защита роутов

---

# ✅ END
