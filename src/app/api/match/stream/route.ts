import { type NextRequest } from "next/server";
import { subscribe, unsubscribe } from "@/server/realtime/match-stream";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return new Response("Missing matchId", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      subscribe(matchId, controller);
      controller.enqueue(new TextEncoder().encode(":ok\n\n"));
    },
    cancel(controller) {
      unsubscribe(matchId, controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
