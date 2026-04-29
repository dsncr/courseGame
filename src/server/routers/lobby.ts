import * as lobbyService from "@/server/services/lobby.service";

export function getRooms() {
  return lobbyService.getRooms();
}

export function createRoom(input: {
  maxPlayers: 2 | 3;
  userId: string;
  name: string;
}) {
  return lobbyService.createRoom(input);
}

export function createBotRoom(input: { userId: string; name: string }) {
  return lobbyService.createBotRoom(input);
}

export function joinRoom(input: {
  matchId: string;
  userId: string;
  name: string;
}) {
  return lobbyService.joinRoom(input);
}

export function getRoom(matchId: string) {
  return lobbyService.getRoom(matchId);
}
