"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, getErrorMessage } from "@/lib/api";
import GameGrid from "./GameGrid";
import ScoreBoard from "./ScoreBoard";
import Timer from "./Timer";
import type { Coordinate, GameState } from "@/server/services/game.types";

type GameClientProps = {
  initialMatchId: string;
  initialPlayerId: string;
  initialPlayerName: string;
};

type RemoteSelection = {
  playerId: string;
  coordinates: Coordinate[];
};

export default function GameClient({
  initialMatchId,
  initialPlayerId,
  initialPlayerName,
}: GameClientProps) {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [selection, setSelection] = useState<Coordinate[]>([]);
  const [remoteSelections, setRemoteSelections] = useState<RemoteSelection[]>([]);
  const [message, setMessage] = useState(
    initialMatchId ? "Матч загружается." : "Откройте матч из лобби.",
  );
  const [isBusy, setIsBusy] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const myColor =
    state?.players.find((player) => player.id === initialPlayerId)?.color ?? "#4f46e5";

  const selectedWord = useMemo(() => {
    if (!state) return "";
    return selection.map((coordinate) => state.grid[coordinate.y][coordinate.x]).join("");
  }, [selection, state]);

  const refreshState = useCallback(async (id: string, showErrors = true) => {
    try {
      const nextState = await apiPost<GameState>("/api/match", "getState", { matchId: id });
      setState(nextState);
      setMessage((current) =>
        current === "Матч загружается." ? "Игра началась." : current,
      );
    } catch (error) {
      if (showErrors) setMessage(getErrorMessage(error));
    }
  }, []);

  function sendSelection(nextSelection: Coordinate[]) {
    if (!initialMatchId || !initialPlayerId) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void apiPost("/api/match", "setSelection", {
        matchId: initialMatchId,
        playerId: initialPlayerId,
        coordinates: nextSelection,
      });
    }, 80);
  }

  function handleSelectionChange(nextSelection: Coordinate[]) {
    setSelection(nextSelection);
    sendSelection(nextSelection);
  }

  async function surrender() {
    if (!initialMatchId || !initialPlayerId) return;
    setIsBusy(true);
    try {
      await apiPost("/api/match", "leaveMatch", {
        matchId: initialMatchId,
        playerId: initialPlayerId,
      });
      router.push("/");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function submitSelection() {
    if (!initialMatchId || !initialPlayerId || selection.length < 2) {
      setMessage("Выделите слово на поле.");
      return;
    }
    setIsBusy(true);
    try {
      await apiPost("/api/match", "submitWord", {
        matchId: initialMatchId,
        playerId: initialPlayerId,
        word: selectedWord,
        coordinates: selection,
      });
      setSelection([]);
      sendSelection([]);
      setMessage(`Слово "${selectedWord}" засчитано.`);
      await refreshState(initialMatchId);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    if (!initialMatchId) return;
    const initialFetch = window.setTimeout(() => void refreshState(initialMatchId), 0);
    const eventSource = new EventSource(`/api/match/stream?matchId=${initialMatchId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as unknown;
      const payload = data as { type?: string; playerId?: string; coordinates?: Coordinate[] };

      if (payload.type === "selection" && payload.playerId && payload.playerId !== initialPlayerId) {
        const remotePlayerId = payload.playerId;
        setRemoteSelections((current) => {
          const filtered = current.filter((item) => item.playerId !== remotePlayerId);
          if (payload.coordinates && payload.coordinates.length > 0) {
            return [...filtered, { playerId: remotePlayerId, coordinates: payload.coordinates }];
          }
          return filtered;
        });
      } else {
        void refreshState(initialMatchId, false);
      }
    };

    eventSource.onerror = () => eventSource.close();
    const fallbackInterval = window.setInterval(() => void refreshState(initialMatchId, false), 5000);

    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(fallbackInterval);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      eventSource.close();
    };
  }, [initialMatchId, refreshState, initialPlayerId]);

  return (
    <main className="page-container p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Panel */}
        <section className="card">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2 space-y-2">
              <p className="eyebrow">Competitive word search</p>
              <h1 className="text-3xl font-bold">Соревновательный филворд</h1>
              <p className="text-text-secondary">
                Ищите слова на общем поле. Сервер проверяет выделенные клетки и
                обновляет счет всех игроков.
              </p>
            </div>
            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs text-text-secondary font-semibold">Имя</span>
                <input className="input-field" readOnly value={initialPlayerName || "Игрок"} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-text-secondary font-semibold">ID матча</span>
                <input className="input-field" readOnly value={initialMatchId || "не выбран"} />
              </label>
              <div className="flex gap-2 flex-wrap">
                <button className="btn-secondary py-2 px-4" onClick={() => router.push("/")} type="button">
                  Выйти на главный экран
                </button>
                <button className="btn-danger py-2 px-4" onClick={surrender} disabled={isBusy} type="button">
                  Сдаться
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Status Strip */}
        <section className="card flex flex-wrap items-center gap-4">
          <Timer seconds={state?.timer ?? 180} status={state?.match.status ?? "waiting"} />
          <div>
            <span className="text-xs text-text-secondary font-bold uppercase block">Матч</span>
            <strong className="text-lg">{initialMatchId || "не выбран"}</strong>
          </div>
          <div>
            <span className="text-xs text-text-secondary font-bold uppercase block">Выбрано</span>
            <strong className="text-lg">{selectedWord || "..."}</strong>
          </div>
          <div className="flex gap-2 ml-auto">
            <button className="btn-primary" onClick={submitSelection} disabled={isBusy || selection.length < 2}>
              Отправить слово
            </button>
            <button className="btn-secondary" onClick={() => { setSelection([]); sendSelection([]); }}>
              Сбросить
            </button>
          </div>
        </section>

        {message && <p className="text-error font-bold">{message}</p>}

        {/* Game Layout */}
        <section className="layout-grid">
          <div className="main-content">
            <GameGrid
              grid={state?.grid ?? []}
              words={state?.words ?? []}
              selection={selection}
              playerColor={myColor}
              players={state?.players ?? []}
              remoteSelections={remoteSelections}
              onSelectionChange={handleSelectionChange}
            />
          </div>
          <div className="sidebar">
            <ScoreBoard
              players={state?.players ?? []}
              words={state?.words ?? []}
              currentPlayerId={initialPlayerId}
              winnerId={state?.winnerId ?? null}
            />
          </div>
        </section>
      </div>

      {/* Result Modal */}
      {state?.match.status === "finished" && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <ResultContent state={state} />
            <button className="btn-primary w-full" onClick={() => router.push("/")} type="button">
              Вернуться в лобби
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function ResultContent({ state }: { state: GameState }) {
  const winner = state.players.find((player) => player.id === state.winnerId);

  if (state.finishedReason === "surrender") {
    return (
      <>
        <h2 className="text-2xl font-bold">Игра завершена досрочно</h2>
        <div className="surrender-info">
          {state.surrenderedByImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.surrenderedByImage} alt="" className="surrender-avatar" />
          ) : (
            <div className="surrender-avatar-placeholder">
              {state.surrenderedByName?.slice(0, 1).toUpperCase() ?? "?"}
            </div>
          )}
          <p className="text-text-secondary">
            <strong className="text-white">{state.surrenderedByName ?? "Игрок"}</strong> сдался досрочно
          </p>
        </div>
        {winner && (
          <p className="winner-line">
            Победитель: <strong>{winner.name}</strong> — {winner.score} слов
          </p>
        )}
      </>
    );
  }

  if (state.finishedReason === "time") {
    return (
      <>
        <h2 className="text-2xl font-bold">Время вышло!</h2>
        {winner ? (
          <p className="winner-line">
            Победитель: <strong>{winner.name}</strong> — {winner.score} слов
          </p>
        ) : (
          <p className="text-text-secondary">Никто не успел найти слова.</p>
        )}
      </>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold">Матч завершён</h2>
      {winner ? (
        <p className="winner-line">
          Победитель: <strong>{winner.name}</strong> — {winner.score} слов
        </p>
      ) : (
        <p className="text-text-secondary">Все слова разобраны.</p>
      )}
    </>
  );
}
