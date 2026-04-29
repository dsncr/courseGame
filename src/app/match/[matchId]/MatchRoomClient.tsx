"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, getErrorMessage } from "@/lib/api";
import type { Match, Player } from "@/server/services/game.types";

type MatchRoomClientProps = {
  matchId: string;
  initialPlayerId: string;
};

type RoomState = {
  match: Match;
  players: Player[];
  isFull: boolean;
};

export default function MatchRoomClient({ matchId, initialPlayerId }: MatchRoomClientProps) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState(initialPlayerId);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [message, setMessage] = useState("Ожидаем игроков.");

  const refreshRoom = useCallback(async () => {
    try {
      const nextRoom = await apiPost<RoomState>("/api/lobby", "getRoom", { matchId });
      setRoom(nextRoom);
      if (nextRoom.match.status === "playing" && playerId) {
        router.replace(`/game?matchId=${matchId}&playerId=${playerId}`);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }, [matchId, playerId, router]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => void refreshRoom(), 0);
    const interval = window.setInterval(() => void refreshRoom(), 1200);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [refreshRoom]);

  async function joinCurrentRoom() {
    try {
      const joined = await apiPost<{ playerId: string }>("/api/lobby", "joinRoom", { matchId });
      setPlayerId(joined.playerId);
      setMessage("Вы в комнате.");
      await refreshRoom();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function leaveCurrentRoom() {
    if (!playerId) return;
    try {
      await apiPost("/api/match", "leaveMatch", { matchId, playerId });
      router.replace("/");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <section className="card w-full max-w-xl space-y-6">
        <div className="space-y-2">
          <p className="eyebrow">Room #{matchId.slice(-6)}</p>
          <h1 className="text-4xl font-bold">Комната ожидания</h1>
          <p className="text-text-secondary">
            Игроки попадут в матч автоматически, когда комната заполнится.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 space-y-1">
            <span className="text-xs text-text-secondary font-bold uppercase">Игроки</span>
            <strong className="text-xl block">
              {room?.players.length ?? 0} / {room?.match.maxPlayers ?? 2}
            </strong>
          </div>
          <div className="card p-4 space-y-1">
            <span className="text-xs text-text-secondary font-bold uppercase">Статус</span>
            <strong className="text-xl block">{room?.match.status ?? "waiting"}</strong>
          </div>
        </div>

        <div className="space-y-2">
          {room?.players.map((player) => (
            <div key={player.id} className="flex items-center gap-3 py-2 border-b border-border">
              <span className="w-3 h-3 rounded-full" style={{ background: player.color }} />
              <strong>{player.name}</strong>
              <span className="text-text-secondary text-sm">{player.id === playerId ? "вы" : "готов"}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          {!playerId && !room?.isFull && (
            <button className="btn-primary" onClick={joinCurrentRoom} type="button">
              Присоединиться
            </button>
          )}
          {playerId && (
            <button className="btn-danger" onClick={leaveCurrentRoom} type="button">
              Покинуть комнату
            </button>
          )}
          <Link className="btn-secondary" href="/">
            К лобби
          </Link>
        </div>

        {message && <p className="text-error font-bold">{message}</p>}
      </section>
    </main>
  );
}
