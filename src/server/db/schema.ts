import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const matches = sqliteTable("matches", {
  id: text("id").primaryKey(),
  status: text("status", { enum: ["waiting", "playing", "finished"] }).notNull(),
  maxPlayers: integer("max_players").notNull().default(2),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  duration: integer("duration").notNull(),
  finishedReason: text("finished_reason", { enum: ["time", "surrender", "allWords"] }),
  surrenderedBy: text("surrendered_by"),
  surrenderedByName: text("surrendered_by_name"),
  surrenderedByImage: text("surrendered_by_image"),
});

export const players = sqliteTable(
  "players",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    score: integer("score").notNull().default(0),
    color: text("color").notNull(),
    joinedAt: integer("joined_at", { mode: "timestamp" }).notNull(),
    foundWordTimes: text("found_word_times", { mode: "json" })
      .$type<number[]>()
      .notNull()
      .default([]),
  },
  (table) => [index("players_match_id_idx").on(table.matchId)],
);

export const words = sqliteTable(
  "words",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    coordinates: text("coordinates", { mode: "json" })
      .$type<Array<{ x: number; y: number }>>()
      .notNull(),
    foundBy: text("found_by"),
    foundAt: integer("found_at", { mode: "timestamp" }),
  },
  (table) => [index("words_match_id_idx").on(table.matchId)],
);

export const grids = sqliteTable("grids", {
  matchId: text("match_id")
    .primaryKey()
    .references(() => matches.id, { onDelete: "cascade" }),
  cells: text("cells", { mode: "json" }).$type<string[][]>().notNull(),
});

export const matchRelations = relations(matches, ({ many, one }) => ({
  players: many(players),
  words: many(words),
  grid: one(grids, {
    fields: [matches.id],
    references: [grids.matchId],
  }),
}));

export const playerRelations = relations(players, ({ one }) => ({
  match: one(matches, {
    fields: [players.matchId],
    references: [matches.id],
  }),
}));

export const wordRelations = relations(words, ({ one }) => ({
  match: one(matches, {
    fields: [words.matchId],
    references: [matches.id],
  }),
}));

export const matchStats = sqliteTable(
  "match_stats",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    playerName: text("player_name").notNull(),
    score: integer("score").notNull().default(0),
    wordsFound: integer("words_found").notNull().default(0),
    rank: integer("rank").notNull().default(0),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
  },
  (table) => [index("match_stats_match_id_idx").on(table.matchId)],
);

export const gridRelations = relations(grids, ({ one }) => ({
  match: one(matches, {
    fields: [grids.matchId],
    references: [matches.id],
  }),
}));
