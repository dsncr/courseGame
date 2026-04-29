import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-in-production",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

export function getGuestName(name?: string) {
  return name?.trim() || "Гость";
}
