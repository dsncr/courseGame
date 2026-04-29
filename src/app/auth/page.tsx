import { redirect } from "next/navigation";
import AuthForm from "./AuthForm";
import { getCurrentSession } from "@/server/auth";

export default async function AuthPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/game");
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <section className="layout-grid w-full max-w-5xl items-center">
        <div className="main-content space-y-4">
          <p className="eyebrow">BetterAuth</p>
          <h1 className="text-4xl font-bold">Вход в игру</h1>
          <p className="text-text-secondary">
            Авторизация хранит сессию в httpOnly cookie, а пароль обрабатывается
            на сервере через BetterAuth.
          </p>
        </div>
        <div className="card">
          <AuthForm />
        </div>
      </section>
    </main>
  );
}
