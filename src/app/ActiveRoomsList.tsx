"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, getErrorMessage } from "@/lib/api";

export type Room = {
  id: string;
  status: "waiting" | "playing" | "finished";
  playersCount: number;
  maxPlayers: number;
  isFull: boolean;
};

type ActiveRoomsListProps = {
  compact?: boolean;
  onError?: (message: string) => void;
};

export default function ActiveRoomsList({ compact, onError }: ActiveRoomsListProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshRooms = useCallback(async () => {
    try {
      const nextRooms = await apiPost<Room[]>("/api/lobby", "getRooms", {});
      setRooms(nextRooms);
    } catch (error) {
      onError?.(getErrorMessage(error));
    }
  }, [onError]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => void refreshRooms(), 0);
    const interval = window.setInterval(() => void refreshRooms(), 1600);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [refreshRooms]);

  async function joinRoom(matchId: string) {
    setLoading(true);
    try {
      const room = await apiPost<{ matchId: string; playerId: string }>("/api/lobby", "joinRoom", {
        matchId,
      });
      router.push(`/match/${room.matchId}?playerId=${room.playerId}`);
    } catch (error) {
      onError?.(getErrorMessage(error));
      await refreshRooms();
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className={`space-y-4 ${compact ? "" : "sticky top-6"}`}>
      <div>
        <h2 className="text-2xl font-semibold">Активные комнаты</h2>
        <p className="text-text-secondary text-sm">
          {rooms.length === 0 ? "Комнат пока нет." : "Список обновляется автоматически."}
        </p>
      </div>

      <div className="space-y-3">
        {rooms.map((room) => (
          <article
            key={room.id}
            className={`p-4 rounded-2xl border transition-all ${
              room.isFull
                ? "bg-disabled border-border text-text-secondary"
                : "bg-surface border-border hover:border-primary/40 hover:shadow-glow"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <strong className="block">Room #{room.id.slice(-6)}</strong>
                {room.status === "playing" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-bold">
                    В игре
                  </span>
                )}
              </div>
              <span className="text-sm text-text-secondary">
                Players: {room.playersCount} / {room.maxPlayers}
              </span>
            </div>
            {room.isFull ? (
              <button
                className="mt-3 w-full py-2 rounded-xl bg-disabled text-text-secondary cursor-not-allowed"
                disabled
                type="button"
              >
                {room.status === "playing" ? "В игре" : "Нет места"}
              </button>
            ) : (
              <button
                className="mt-3 w-full btn-primary py-2"
                onClick={() => joinRoom(room.id)}
                disabled={loading}
                type="button"
              >
                Присоединиться
              </button>
            )}
          </article>
        ))}
      </div>
    </aside>
  );
}
