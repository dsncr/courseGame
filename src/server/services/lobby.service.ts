import { and, eq, inArray } from "drizzle-orm";
import { db, ensureDatabase } from "@/server/db/client";
import { matches, players } from "@/server/db/schema";
import {
  BOT_USER_ID,
  addBot,
  createMatch,
  getStoredMatch,
  joinMatch,
  startMatch,
} from "./game.service";

export type Room = {
  id: string;
  status: "waiting" | "playing" | "finished";
  playersCount: number;
  maxPlayers: number;
  isFull: boolean;
  createdAt: Date;
};

export async function getRooms(): Promise<Room[]> {
  await ensureDatabase();

  const activeMatches = await db
    .select()
    .from(matches)
    .where(inArray(matches.status, ["waiting", "playing"]));

  const roomPlayers =
    activeMatches.length === 0
      ? []
      : await db
          .select()
          .from(players)
          .where(
            inArray(
              players.matchId,
              activeMatches.map((match) => match.id),
            ),
          );

  return activeMatches
    .map((match) => {
      const realPlayers = roomPlayers.filter(
        (player) => player.matchId === match.id && player.userId !== BOT_USER_ID,
      );

      return {
        id: match.id,
        status: match.status,
        playersCount: realPlayers.length,
        maxPlayers: match.maxPlayers,
        isFull: realPlayers.length >= match.maxPlayers || match.status === "playing",
        createdAt: match.createdAt,
      };
    })
    .filter((room) => room.playersCount > 0)
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
}

export async function createRoom(input: {
  maxPlayers: 2 | 3;
  userId: string;
  name: string;
}) {
  await assertUserCanOpenRoom(input.userId);

  const { matchId } = await createMatch(input.maxPlayers);
  const { playerId } = await joinMatch(matchId, input.name, input.userId);

  return { matchId, playerId };
}

export async function createBotRoom(input: { userId: string; name: string }) {
  await assertUserCanOpenRoom(input.userId);

  const { matchId } = await createMatch(2);
  const { playerId } = await joinMatch(matchId, input.name, input.userId);
  await addBot(matchId);
  await startMatch(matchId);

  return { matchId, playerId };
}

export async function joinRoom(input: {
  matchId: string;
  userId: string;
  name: string;
}) {
  const { playerId } = await joinMatch(input.matchId, input.name, input.userId);
  const storedMatch = await getStoredMatch(input.matchId);

  if (
    storedMatch.match.status === "waiting" &&
    storedMatch.players.length >= storedMatch.match.maxPlayers
  ) {
    await startMatch(input.matchId);
  }

  return { success: true, matchId: input.matchId, playerId };
}

export async function getRoom(matchId: string) {
  const storedMatch = await getStoredMatch(matchId);

  return {
    match: storedMatch.match,
    players: storedMatch.players,
    isFull: storedMatch.players.length >= storedMatch.match.maxPlayers,
  };
}

async function assertUserCanOpenRoom(userId: string) {
  await ensureDatabase();

  const activeMatches = await db
    .select({ id: matches.id })
    .from(matches)
    .where(inArray(matches.status, ["waiting", "playing"]));

  if (activeMatches.length === 0) {
    return;
  }

  const [ownActivePlayer] = await db
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

  if (ownActivePlayer) {
    throw new Error("Вы уже находитесь в активной комнате.");
  }
}
