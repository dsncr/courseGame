import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createMatch,
  getState,
  joinMatch,
  leaveMatch,
  startMatch,
  submitWord,
  updateSelection,
} from "@/server/routers/match";

type MatchAction =
  | "createMatch"
  | "joinMatch"
  | "startMatch"
  | "getState"
  | "submitWord"
  | "leaveMatch"
  | "setSelection";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: MatchAction;
      input?: Record<string, unknown>;
    };
    const input = body.input ?? {};
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return json({ error: "Требуется авторизация." }, 401);
    }

    switch (body.action) {
      case "createMatch":
        return json(await createMatch());
      case "joinMatch": {
        const displayName = String(input.name ?? session?.user.name ?? "");

        return json(
          await joinMatch(
            String(input.matchId),
            displayName,
            session.user.id,
          ),
        );
      }
      case "startMatch":
        return json(await startMatch(String(input.matchId)));
      case "getState":
        return json(await getState(String(input.matchId)));
      case "leaveMatch":
        return json(
          await leaveMatch(String(input.matchId), String(input.playerId)),
        );
      case "setSelection":
        return json(
          await updateSelection(
            String(input.matchId),
            String(input.playerId),
            parseCoordinates(input.coordinates),
          ),
        );
      case "submitWord":
        return json(
          await submitWord({
            matchId: String(input.matchId),
            playerId: String(input.playerId),
            word: String(input.word),
            coordinates: parseCoordinates(input.coordinates),
          }),
        );
      default:
        return json({ error: "Неизвестное действие API." }, 400);
    }
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Неизвестная ошибка." },
      400,
    );
  }
}

function parseCoordinates(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => ({
    x: Number((item as { x: unknown }).x),
    y: Number((item as { y: unknown }).y),
  }));
}

function json(payload: unknown, status = 200) {
  return NextResponse.json(payload, { status });
}
