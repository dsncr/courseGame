import type { MatchStatus } from "@/server/services/game.types";

type TimerProps = {
  seconds: number;
  status: MatchStatus;
};

export default function Timer({ seconds, status }: TimerProps) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return (
    <div>
      <span>{statusLabel[status]}</span>
      <strong>
        {minutes}:{rest.toString().padStart(2, "0")}
      </strong>
    </div>
  );
}

const statusLabel: Record<MatchStatus, string> = {
  waiting: "Ожидание",
  playing: "Игра",
  finished: "Финиш",
};
