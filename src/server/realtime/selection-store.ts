import type { Coordinate } from "@/server/services/game.types";
import { broadcast } from "./match-stream";

const selections = new Map<string, Map<string, Coordinate[]>>();

export function setSelection(
  matchId: string,
  playerId: string,
  coordinates: Coordinate[],
) {
  if (!selections.has(matchId)) {
    selections.set(matchId, new Map());
  }
  selections.get(matchId)!.set(playerId, coordinates);

  broadcast(matchId, {
    type: "selection",
    playerId,
    coordinates,
  });
}

export function getSelections(matchId: string): Map<string, Coordinate[]> {
  return selections.get(matchId) ?? new Map();
}

export function clearMatchSelections(matchId: string) {
  selections.delete(matchId);
}
