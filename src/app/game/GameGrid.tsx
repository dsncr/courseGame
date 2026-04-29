"use client";

import type { Coordinate, Player, Word } from "@/server/services/game.types";
import { cn } from "@/lib/utils";

type RemoteSelection = {
  playerId: string;
  coordinates: Coordinate[];
};

type GameGridProps = {
  grid: string[][];
  words: Word[];
  selection: Coordinate[];
  playerColor: string;
  players: Player[];
  remoteSelections: RemoteSelection[];
  onSelectionChange: (selection: Coordinate[]) => void;
};

export default function GameGrid({
  grid,
  words,
  selection,
  playerColor,
  players,
  remoteSelections,
  onSelectionChange,
}: GameGridProps) {
  const foundCells = new Map<string, string>();
  const foundCellColors = new Map<string, string>();

  for (const word of words) {
    if (!word.foundBy) {
      continue;
    }
    const color = players.find((p) => p.id === word.foundBy)?.color ?? "#059669";
    for (const coordinate of word.coordinates) {
      const key = toKey(coordinate);
      foundCells.set(key, word.foundBy);
      foundCellColors.set(key, color);
    }
  }

  const remoteCellColors = new Map<string, string>();
  for (const remote of remoteSelections) {
    const color = players.find((p) => p.id === remote.playerId)?.color;
    if (!color) continue;
    for (const coordinate of remote.coordinates) {
      remoteCellColors.set(toKey(coordinate), color);
    }
  }

  function toggleCell(coordinate: Coordinate) {
    const index = selection.findIndex((item) => sameCoordinate(item, coordinate));

    if (index >= 0) {
      onSelectionChange(selection.slice(0, index));
      return;
    }

    if (selection.length > 0 && !isNeighbor(selection[selection.length - 1], coordinate)) {
      onSelectionChange([coordinate]);
      return;
    }

    onSelectionChange([...selection, coordinate]);
  }

  if (grid.length === 0) {
    return <div className="empty-grid">Создайте или откройте матч, чтобы увидеть поле.</div>;
  }

  return (
    <div className="grid-wrap" aria-label="Игровое поле 10 на 10">
      {grid.map((row, y) =>
        row.map((letter, x) => {
          const coordinate = { x, y };
          const key = toKey(coordinate);
          const isSelected = selection.some((item) => sameCoordinate(item, coordinate));
          const isFound = foundCells.has(key);
          const remoteColor = remoteCellColors.get(key);
          const foundColor = foundCellColors.get(key);

          const style: React.CSSProperties = {};
          if (isSelected) {
            style.backgroundColor = playerColor;
            style.borderColor = playerColor;
            style.color = "#fff";
          } else if (isFound && foundColor) {
            style.backgroundColor = foundColor + "33";
            style.borderColor = foundColor;
          } else if (remoteColor) {
            style.backgroundColor = remoteColor + "44";
            style.borderColor = remoteColor;
          }

          return (
            <button
              className={cn("grid-cell", isSelected && "selected", isFound && "found")}
              key={`${x}-${y}`}
              onClick={() => toggleCell(coordinate)}
              type="button"
              style={style}
            >
              {letter}
            </button>
          );
        }),
      )}
    </div>
  );
}

function sameCoordinate(first: Coordinate, second: Coordinate) {
  return first.x === second.x && first.y === second.y;
}

function isNeighbor(first: Coordinate, second: Coordinate) {
  return Math.abs(first.x - second.x) <= 1 && Math.abs(first.y - second.y) <= 1;
}

function toKey(coordinate: Coordinate) {
  return `${coordinate.x}:${coordinate.y}`;
}
