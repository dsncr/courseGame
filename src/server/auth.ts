import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ensureDatabase } from "@/server/db/client";

export async function getCurrentSession() {
  await ensureDatabase();
  return auth.api.getSession({
    headers: await headers(),
  });
}
