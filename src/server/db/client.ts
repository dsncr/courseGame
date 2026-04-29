import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "file:local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle(client, { schema });

let initPromise: Promise<void> | null = null;

export function ensureDatabase() {
  initPromise ??= bootstrapDatabase();
  return initPromise;
}

async function bootstrapDatabase() {
  await db.run(sql`PRAGMA foreign_keys = ON`);

  if (process.env.NODE_ENV !== "production") {
    await db.run(sql`DELETE FROM match_stats`);
    await db.run(sql`DELETE FROM grids`);
    await db.run(sql`DELETE FROM words`);
    await db.run(sql`DELETE FROM players`);
    await db.run(sql`DELETE FROM matches`);
  }

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY NOT NULL,
      expires_at INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY NOT NULL,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      max_players INTEGER NOT NULL DEFAULT 2,
      created_at INTEGER NOT NULL,
      started_at INTEGER,
      finished_at INTEGER,
      duration INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      match_id TEXT NOT NULL,
      name TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL,
      joined_at INTEGER NOT NULL,
      found_word_times TEXT NOT NULL DEFAULT '[]',
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS words (
      id TEXT PRIMARY KEY NOT NULL,
      match_id TEXT NOT NULL,
      value TEXT NOT NULL,
      coordinates TEXT NOT NULL,
      found_by TEXT,
      found_at INTEGER,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS grids (
      match_id TEXT PRIMARY KEY NOT NULL,
      cells TEXT NOT NULL,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS match_stats (
      id TEXT PRIMARY KEY NOT NULL,
      match_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      words_found INTEGER NOT NULL DEFAULT 0,
      rank INTEGER NOT NULL DEFAULT 0,
      finished_at INTEGER,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn("matches", "max_players", "INTEGER NOT NULL DEFAULT 2");
  await ensureColumn("matches", "finished_reason", "TEXT");
  await ensureColumn("matches", "surrendered_by", "TEXT");
  await ensureColumn("matches", "surrendered_by_name", "TEXT");
  await ensureColumn("matches", "surrendered_by_image", "TEXT");

  await db.run(sql`CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS account_user_id_idx ON account(user_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS players_match_id_idx ON players(match_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS words_match_id_idx ON words(match_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS match_stats_match_id_idx ON match_stats(match_id)`);
}

async function ensureColumn(tableName: string, columnName: string, definition: string) {
  const result = await db.run(sql.raw(`PRAGMA table_info(${tableName})`));
  const rows = result.rows as Array<{ name?: string }>;
  const hasColumn = rows.some((row) => row.name === columnName);

  if (!hasColumn) {
    await db.run(sql.raw(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`));
  }
}
