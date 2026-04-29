import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { ensureDatabase } from "@/server/db/client";

const handlers = toNextJsHandler(auth);

export async function GET(request: Request) {
  await ensureDatabase();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  await ensureDatabase();
  return handlers.POST(request);
}

export async function PATCH(request: Request) {
  await ensureDatabase();
  return handlers.PATCH(request);
}

export async function PUT(request: Request) {
  await ensureDatabase();
  return handlers.PUT(request);
}

export async function DELETE(request: Request) {
  await ensureDatabase();
  return handlers.DELETE(request);
}
