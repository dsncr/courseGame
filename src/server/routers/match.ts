import type { Coordinate } from "@/server/services/game.types";
import * as gameService from "@/server/services/game.service";
import { setSelection } from "@/server/realtime/selection-store";

export function createMatch() {
  return gameService.createMatch();
}

export function joinMatch(matchId: string, name?: string, userId?: string) {
  return gameService.joinMatch(matchId, name, userId);
}

export function startMatch(matchId: string) {
  return gameService.startMatch(matchId);
}

export function getState(matchId: string) {
  return gameService.getState(matchId);
}

export function leaveMatch(matchId: string, playerId: string) {
  return gameService.leaveMatch(matchId, playerId);
}

export function updateSelection(matchId: string, playerId: string, coordinates: Coordinate[]) {
  setSelection(matchId, playerId, coordinates);
  return { success: true };
}

export function submitWord(input: {
  matchId: string;
  playerId: string;
  word: string;
  coordinates: Coordinate[];
}) {
  return gameService.submitWord(
    input.matchId,
    input.playerId,
    input.word,
    input.coordinates,
  );
}
