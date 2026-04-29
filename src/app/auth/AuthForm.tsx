"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

type AuthResponse = {
  message?: string;
  code?: string;
};

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "register" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(mode === "register" ? { name: getNameFromEmail(email) } : {}),
          callbackURL: "/game",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as AuthResponse;

      if (!response.ok) {
        throw new Error(toAuthMessage(payload));
      }

      router.replace("/game");
      router.refresh();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Не удалось выполнить запрос.",
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex gap-2 p-1 rounded-xl bg-bg border border-border" aria-label="Режим авторизации">
        <button
          className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
            mode === "login" ? "bg-primary text-white" : "text-text-secondary hover:text-white"
          }`}
          type="button"
          onClick={() => switchMode("login")}
        >
          Вход
        </button>
        <button
          className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
            mode === "register" ? "bg-primary text-white" : "text-text-secondary hover:text-white"
          }`}
          type="button"
          onClick={() => switchMode("register")}
        >
          Регистрация
        </button>
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-text-secondary font-semibold">Email</span>
        <input
          className="input-field"
          autoComplete="email"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-text-secondary font-semibold">Пароль</span>
        <input
          className="input-field"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Минимум 8 символов"
          required
          type="password"
          value={password}
        />
      </label>

      {error && (
        <p className="rounded-xl border border-error/30 bg-error/10 text-error p-3 text-sm font-bold">
          {error}
        </p>
      )}

      <button className="btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Проверяем..." : mode === "register" ? "Создать аккаунт" : "Войти"}
      </button>
    </form>
  );
}

function getNameFromEmail(email: string) {
  return email.split("@")[0]?.trim() || "Игрок";
}

function toAuthMessage(payload: AuthResponse) {
  const source = `${payload.code ?? ""} ${payload.message ?? ""}`.toLowerCase();

  if (source.includes("already")) {
    return "Пользователь с таким email уже существует.";
  }

  if (source.includes("invalid") || source.includes("unauthorized")) {
    return "Неверный email или пароль.";
  }

  if (source.includes("short")) {
    return "Пароль слишком короткий.";
  }

  return payload.message ?? "Ошибка сервера. Попробуйте еще раз.";
}
