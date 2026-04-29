import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createBotRoom,
  createRoom,
  getRoom,
  getRooms,
  joinRoom,
} from "@/server/routers/lobby";

type LobbyAction = "getRooms" | "createRoom" | "createBotRoom" | "joinRoom" | "getRoom";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return json({ error: "Требуется авторизация." }, 401);
    }

    const body = (await request.json()) as {
      action?: LobbyAction;
      input?: Record<string, unknown>;
    };
    const input = body.input ?? {};

    switch (body.action) {
      case "getRooms":
        return json(await getRooms());
      case "createRoom":
        return json(
          await createRoom({
            maxPlayers: parseMaxPlayers(input.maxPlayers),
            userId: session.user.id,
            name: session.user.name,
          }),
        );
      case "createBotRoom":
        return json(
          await createBotRoom({
            userId: session.user.id,
            name: session.user.name,
          }),
        );
      case "joinRoom":
        return json(
          await joinRoom({
            matchId: String(input.matchId),
            userId: session.user.id,
            name: session.user.name,
          }),
        );
      case "getRoom":
        return json(await getRoom(String(input.matchId)));
      default:
        return json({ error: "Неизвестное действие lobby API." }, 400);
    }
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Неизвестная ошибка." },
      400,
    );
  }
}

function parseMaxPlayers(value: unknown): 2 | 3 {
  return Number(value) === 3 ? 3 : 2;
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}
