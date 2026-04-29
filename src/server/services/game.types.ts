export type MatchStatus = "waiting" | "playing" | "finished";

export type Coordinate = {
  x: number;
  y: number;
};

export type User = {
  id: string;
  name: string;
  createdAt: Date;
};

export type Player = {
  id: string;
  userId: string;
  matchId: string;
  name: string;
  score: number;
  color: string;
  joinedAt: Date;
  foundWordTimes: number[];
};

export type Word = {
  id: string;
  matchId: string;
  value: string;
  coordinates: Coordinate[];
  foundBy: string | null;
  foundAt: Date | null;
};

export type Grid = {
  matchId: string;
  cells: string[][];
};

export type Match = {
  id: string;
  status: MatchStatus;
  maxPlayers: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  duration: number;
  finishedReason: "time" | "surrender" | "allWords" | null;
  surrenderedBy: string | null;
  surrenderedByName: string | null;
  surrenderedByImage: string | null;
};

export type GameState = {
  match: Match;
  grid: string[][];
  players: Player[];
  words: Word[];
  timer: number;
  winnerId: string | null;
  finishedReason: "time" | "surrender" | "allWords" | null;
  surrenderedBy: string | null;
  surrenderedByName: string | null;
  surrenderedByImage: string | null;
};

export type StoredMatch = {
  match: Match;
  grid: Grid;
  players: Player[];
  words: Word[];
};
