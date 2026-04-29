import { and, eq, inArray } from "drizzle-orm";
import { db, ensureDatabase } from "@/server/db/client";
import { grids, matches, matchStats, players, words, user } from "@/server/db/schema";
import type {
  Coordinate,
  GameState,
  Grid,
  Match,
  Player,
  StoredMatch,
  Word,
} from "./game.types";
import { broadcast } from "@/server/realtime/match-stream";
import { generateGrid } from "./grid.service";
import { checkSubmittedWord } from "./word.service";

const MATCH_DURATION_SECONDS = 180;
const DEFAULT_MAX_PLAYERS = 2;
const BOT_MOVE_DELAY_MS = 12000;
const BOT_FIRST_MOVE_DELAY_MS = 9000;
export const BOT_USER_ID = "bot";

const WORD_POOL = [
  "ДИЗАЙН",
  "МОНТАЖ",
  "КАМЕРА",
  "ПРОЕКТ",
  "РЕНДЕР",
  "ПИКСЕЛЬ",
  "ГРАФИКА",
  "МОДЕЛЬ",
  "ТЕКСТУРА",
  "АНИМАЦИЯ",
  "ИНТЕРФЕЙС",
  "ШАБЛОН",
  "ВИЗУАЛ",
  "КАДР",
  "ЭКСПОРТ",
  "ЭФФЕКТ",
  "ЦВЕТ",
  "КОНТРАСТ",
  "КОМПОЗИЦИЯ",
  "ОБРАБОТКА",
  "ПЕЧАТЬ",
  "ЛАЗЕР",
  "ГРАВИРОВКА",
  "СКАНЕР",
  "ПРОТОТИП",
];

function pickRandomWords(pool: string[], count: number) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
const COLORS = [
  "#dc2626", // красный
  "#2563eb", // голубой
  "#059669", // зелёный
  "#eab308", // жёлтый
  "#92400e", // коричневый
  "#7c3aed", // фиолетовый
  "#1e3a8a", // темно-синий
  "#ec4899", // розовый
];

function pickRandomColor(usedColors: string[]): string {
  const available = COLORS.filter((color) => !usedColors.includes(color));
  if (available.length === 0) {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

export async function createMatch(maxPlayers = DEFAULT_MAX_PLAYERS) {
  await ensureDatabase();

  const matchId = createId("match");
  const now = new Date();
  const wordsForMatch = pickRandomWords(WORD_POOL, 10);
  const generatedGrid = generateGrid(wordsForMatch);

  await db.insert(matches).values({
    id: matchId,
    status: "waiting",
    maxPlayers,
    createdAt: now,
    startedAt: null,
    finishedAt: null,
    duration: MATCH_DURATION_SECONDS,
  });

  await db.insert(grids).values({
    matchId,
    cells: generatedGrid.cells,
  });

  await db.insert(words).values(
    generatedGrid.words.map((word) => ({
      id: createId("word"),
      matchId,
      value: word.value,
      coordinates: word.coordinates,
      foundBy: null,
      foundAt: null,
    })),
  );

  return { matchId };
}

export async function joinMatch(matchId: string, name?: string, userId?: string) {
  await ensureDatabase();
  const storedMatch = await getStoredMatch(matchId);
  const resolvedUserId = userId ?? createId("guest");
  const existingPlayer = storedMatch.players.find(
    (player) => player.userId === resolvedUserId,
  );

  if (existingPlayer) {
    return { playerId: existingPlayer.id };
  }

  if (storedMatch.players.length >= storedMatch.match.maxPlayers) {
    throw new Error("В комнате нет свободных мест.");
  }

  const activeRooms = await getActiveRoomsForUser(resolvedUserId);

  if (activeRooms.some((room) => room.matchId !== matchId)) {
    throw new Error("Вы уже находитесь в другой активной комнате.");
  }

  const usedColors = storedMatch.players.map((p) => p.color);
  const player: Player = {
    id: createId("player"),
    userId: resolvedUserId,
    matchId,
    name: name?.trim() || `Игрок ${storedMatch.players.length + 1}`,
    score: 0,
    color: pickRandomColor(usedColors),
    joinedAt: new Date(),
    foundWordTimes: [],
  };

  await db.insert(players).values(player);
  return { playerId: player.id };
}

export async function addBot(matchId: string) {
  const storedMatch = await getStoredMatch(matchId);

  if (storedMatch.players.some((player) => player.userId === BOT_USER_ID)) {
    return;
  }

  const usedColors = storedMatch.players.map((p) => p.color);
  const player: Player = {
    id: createId("player"),
    userId: BOT_USER_ID,
    matchId,
    name: "Бот",
    score: 0,
    color: pickRandomColor(usedColors),
    joinedAt: new Date(),
    foundWordTimes: [],
  };

  await db.insert(players).values(player);
}

export async function startMatch(matchId: string) {
  await ensureDatabase();
  const storedMatch = await getStoredMatch(matchId);

  if (storedMatch.match.status === "finished") {
    throw new Error("Матч уже завершен.");
  }

  await db
    .update(matches)
    .set({
      status: "playing",
      startedAt: new Date(),
      finishedAt: null,
    })
    .where(eq(matches.id, matchId));

  return { success: true };
}

export async function getState(matchId: string): Promise<GameState> {
  await ensureDatabase();
  const storedMatch = await getStoredMatch(matchId);
  await finishExpiredMatch(storedMatch);
  await maybePlayBotTurn(storedMatch);

  const freshMatch = await getStoredMatch(matchId);

  return {
    match: freshMatch.match,
    grid: freshMatch.grid.cells,
    players: freshMatch.players,
    words: freshMatch.words,
    timer: getRemainingSeconds(freshMatch),
    winnerId: getWinnerId(freshMatch),
    finishedReason: freshMatch.match.finishedReason,
    surrenderedBy: freshMatch.match.surrenderedBy,
    surrenderedByName: freshMatch.match.surrenderedByName,
    surrenderedByImage: freshMatch.match.surrenderedByImage,
  };
}

function broadcastUpdate(matchId: string) {
  broadcast(matchId, { type: "update", matchId });
}

export async function saveMatchStats(matchId: string) {
  await ensureDatabase();
  const storedMatch = await getStoredMatch(matchId);

  if (storedMatch.match.status !== "finished") {
    return;
  }

  const existing = await db
    .select()
    .from(matchStats)
    .where(eq(matchStats.matchId, matchId));

  if (existing.length > 0) {
    return;
  }

  const ranked = [...storedMatch.players].sort((first, second) => {
    if (second.score !== first.score) {
      return second.score - first.score;
    }
    return getFirstFoundTime(first) - getFirstFoundTime(second);
  });

  for (let index = 0; index < ranked.length; index += 1) {
    const player = ranked[index];
    await db.insert(matchStats).values({
      id: createId("stats"),
      matchId,
      userId: player.userId,
      playerName: player.name,
      score: player.score,
      wordsFound: player.score,
      rank: index + 1,
      finishedAt: storedMatch.match.finishedAt ?? new Date(),
    });
  }
}

export async function leaveMatch(matchId: string, playerId: string) {
  await ensureDatabase();
  const storedMatch = await getStoredMatch(matchId);

  const player = storedMatch.players.find((item) => item.id === playerId);

  if (!player) {
    throw new Error("Игрок не найден в матче.");
  }

  const [userRecord] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, player.userId));

  await db.delete(players).where(eq(players.id, playerId));

  await db
    .update(matches)
    .set({
      status: "finished",
      finishedAt: new Date(),
      finishedReason: "surrender",
      surrenderedBy: playerId,
      surrenderedByName: player.name,
      surrenderedByImage: userRecord?.image ?? null,
    })
      .where(eq(matches.id, matchId));

  broadcastUpdate(matchId);
  await saveMatchStats(matchId);
  return { success: true };
}

export async function submitWord(
  matchId: string,
  playerId: string,
  word: string,
  coordinates: Coordinate[],
) {
  await ensureDatabase();
  const storedMatch = await getStoredMatch(matchId);
  await finishExpiredMatch(storedMatch);

  if (storedMatch.match.status !== "playing") {
    throw new Error("Матч еще не идет или уже завершен.");
  }

  const player = storedMatch.players.find((item) => item.id === playerId);

  if (!player) {
    throw new Error("Игрок не найден в матче.");
  }

  const result = checkSubmittedWord(storedMatch, word, coordinates);

  if (!result.success) {
    throw new Error(result.error);
  }

  await markWordFound(result.word.id, player);
  await finishMatchIfAllWordsFound(matchId);
  broadcastUpdate(matchId);

  return { success: true };
}

export async function getStoredMatch(matchId: string): Promise<StoredMatch> {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId));

  if (!match) {
    throw new Error("Матч не найден.");
  }

  const [grid] = await db.select().from(grids).where(eq(grids.matchId, matchId));
  const matchPlayers = await db.select().from(players).where(eq(players.matchId, matchId));
  const matchWords = await db.select().from(words).where(eq(words.matchId, matchId));

  if (!grid) {
    throw new Error("Поле матча не найдено.");
  }

  return {
    match: mapMatch(match),
    grid: mapGrid(grid),
    players: matchPlayers.map(mapPlayer),
    words: matchWords.map(mapWord),
  };
}

async function maybePlayBotTurn(storedMatch: StoredMatch) {
  if (storedMatch.match.status !== "playing" || !storedMatch.match.startedAt) {
    return;
  }

  const bot = storedMatch.players.find((player) => player.userId === BOT_USER_ID);

  if (!bot) {
    return;
  }

  const humans = storedMatch.players.filter((player) => player.userId !== BOT_USER_ID);
  const topHumanScore = Math.max(0, ...humans.map((player) => player.score));

  if (topHumanScore === 0 || bot.score >= topHumanScore) {
    return;
  }

  const now = Date.now();
  const startedAt = storedMatch.match.startedAt.getTime();
  const lastBotMove = bot.foundWordTimes.at(-1) ?? startedAt;
  const requiredDelay =
    bot.foundWordTimes.length === 0 ? BOT_FIRST_MOVE_DELAY_MS : BOT_MOVE_DELAY_MS;

  if (now - Math.max(startedAt, lastBotMove) < requiredDelay) {
    return;
  }

  const availableWord = storedMatch.words.find((word) => !word.foundBy);

  if (!availableWord) {
    return;
  }

  await markWordFound(availableWord.id, bot);
  await finishMatchIfAllWordsFound(storedMatch.match.id);
  broadcastUpdate(storedMatch.match.id);
}

async function markWordFound(wordId: string, player: Player) {
  const foundAt = new Date();
  const nextFoundWordTimes = [...player.foundWordTimes, Date.now()];

  await db.update(words).set({ foundBy: player.id, foundAt }).where(eq(words.id, wordId));
  await db
    .update(players)
    .set({
      score: player.score + 1,
      foundWordTimes: nextFoundWordTimes,
    })
    .where(eq(players.id, player.id));

  broadcastUpdate(player.matchId);
}

async function finishMatchIfAllWordsFound(matchId: string) {
  const nextStoredMatch = await getStoredMatch(matchId);

  if (nextStoredMatch.words.every((item) => item.foundBy)) {
    await db
      .update(matches)
      .set({ status: "finished", finishedAt: new Date(), finishedReason: "allWords" })
      .where(eq(matches.id, matchId));
    broadcastUpdate(matchId);
    await saveMatchStats(matchId);
  }
}

async function getActiveRoomsForUser(userId: string) {
  const activeMatches = await db
    .select({ id: matches.id })
    .from(matches)
    .where(inArray(matches.status, ["waiting", "playing"]));

  if (activeMatches.length === 0) {
    return [];
  }

  return db
    .select()
    .from(players)
    .where(
      and(
        eq(players.userId, userId),
        inArray(
          players.matchId,
          activeMatches.map((match) => match.id),
        ),
      ),
    );
}

function mapMatch(match: typeof matches.$inferSelect): Match {
  return {
    id: match.id,
    status: match.status,
    maxPlayers: match.maxPlayers,
    createdAt: match.createdAt,
    startedAt: match.startedAt,
    finishedAt: match.finishedAt,
    duration: match.duration,
    finishedReason: match.finishedReason as Match["finishedReason"],
    surrenderedBy: match.surrenderedBy,
    surrenderedByName: match.surrenderedByName,
    surrenderedByImage: match.surrenderedByImage,
  };
}

function mapGrid(grid: typeof grids.$inferSelect): Grid {
  return {
    matchId: grid.matchId,
    cells: grid.cells,
  };
}

function mapPlayer(player: typeof players.$inferSelect): Player {
  return {
    id: player.id,
    userId: player.userId,
    matchId: player.matchId,
    name: player.name,
    score: player.score,
    color: player.color,
    joinedAt: player.joinedAt,
    foundWordTimes: player.foundWordTimes,
  };
}

function mapWord(word: typeof words.$inferSelect): Word {
  return {
    id: word.id,
    matchId: word.matchId,
    value: word.value,
    coordinates: word.coordinates,
    foundBy: word.foundBy,
    foundAt: word.foundAt,
  };
}

function getRemainingSeconds(storedMatch: StoredMatch) {
  if (!storedMatch.match.startedAt) {
    return storedMatch.match.duration;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - storedMatch.match.startedAt.getTime()) / 1000,
  );
  return Math.max(storedMatch.match.duration - elapsedSeconds, 0);
}

async function finishExpiredMatch(storedMatch: StoredMatch) {
  if (storedMatch.match.status === "playing" && getRemainingSeconds(storedMatch) <= 0) {
    const finishedAt = new Date();
    await db
      .update(matches)
      .set({ status: "finished", finishedAt, finishedReason: "time" })
      .where(eq(matches.id, storedMatch.match.id));
    storedMatch.match.status = "finished";
    storedMatch.match.finishedAt = finishedAt;
    storedMatch.match.finishedReason = "time";
    broadcastUpdate(storedMatch.match.id);
    await saveMatchStats(storedMatch.match.id);
  }
}

function getWinnerId(storedMatch: StoredMatch) {
  if (storedMatch.match.status !== "finished") {
    return null;
  }

  const [winner] = [...storedMatch.players].sort((first, second) => {
    if (second.score !== first.score) {
      return second.score - first.score;
    }

    return getFirstFoundTime(first) - getFirstFoundTime(second);
  });

  return winner?.score ? winner.id : null;
}

function getFirstFoundTime(player: Player) {
  return player.foundWordTimes[0] ?? Number.MAX_SAFE_INTEGER;
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
