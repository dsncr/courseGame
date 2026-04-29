import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, ensureDatabase } from "@/server/db/client";
import { players, user } from "@/server/db/schema";

export async function PATCH(request: NextRequest) {
  try {
    await ensureDatabase();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return json({ error: "Требуется авторизация." }, 401);
    }

    const body = (await request.json()) as { name?: unknown; image?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const image = typeof body.image === "string" ? body.image : undefined;

    if (name.length < 2) {
      return json({ error: "Имя должно быть не короче 2 символов." }, 400);
    }

    if (image && !image.startsWith("data:image/")) {
      return json({ error: "Аватар должен быть изображением." }, 400);
    }

    await db
      .update(user)
      .set({
        name,
        image: image ?? session.user.image ?? null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    await db.update(players).set({ name }).where(eq(players.userId, session.user.id));

    return json({ success: true });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Неизвестная ошибка." },
      400,
    );
  }
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}
