import type { Coordinate } from "./game.types";

const GRID_SIZE = 10;
const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 1 },
] as const;
const LETTERS = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ";

export type PlacedWord = {
  value: string;
  coordinates: Coordinate[];
};

export type GeneratedGrid = {
  cells: string[][];
  words: PlacedWord[];
};

export function generateGrid(words: string[]): GeneratedGrid {
  const cells = Array.from({ length: GRID_SIZE }, () =>
    Array.from<string | null>({ length: GRID_SIZE }).fill(null),
  );
  const placedWords: PlacedWord[] = [];

  for (const rawWord of words) {
    const word = normalizeWord(rawWord);
    const placed = placeWord(cells, word);

    if (placed) {
      placedWords.push({ value: word, coordinates: placed });
    }
  }

  return {
    cells: cells.map((row) => row.map((cell) => cell ?? randomLetter())),
    words: placedWords,
  };
}

function placeWord(cells: (string | null)[][], word: string) {
  const directions = shuffle([...DIRECTIONS]);

  for (let attempt = 0; attempt < 150; attempt += 1) {
    const direction = directions[attempt % directions.length];
    const start = {
      x: randomInt(0, GRID_SIZE - 1),
      y: randomInt(0, GRID_SIZE - 1),
    };
    const coordinates = getCoordinates(start, direction, word.length);

    if (canPlace(cells, word, coordinates)) {
      coordinates.forEach((coordinate, index) => {
        cells[coordinate.y][coordinate.x] = word[index];
      });
      return coordinates;
    }
  }

  return null;
}

export function readWord(cells: string[][], coordinates: Coordinate[]) {
  return coordinates.map((coordinate) => cells[coordinate.y]?.[coordinate.x]).join("");
}

function getCoordinates(
  start: Coordinate,
  direction: (typeof DIRECTIONS)[number],
  length: number,
) {
  return Array.from({ length }, (_, index) => ({
    x: start.x + direction.x * index,
    y: start.y + direction.y * index,
  }));
}

function canPlace(cells: (string | null)[][], word: string, coordinates: Coordinate[]) {
  return coordinates.every((coordinate, index) => {
    if (
      coordinate.x < 0 ||
      coordinate.y < 0 ||
      coordinate.x >= GRID_SIZE ||
      coordinate.y >= GRID_SIZE
    ) {
      return false;
    }

    const current = cells[coordinate.y][coordinate.x];
    return current === null || current === word[index];
  });
}

function normalizeWord(word: string) {
  return word.trim().toLocaleUpperCase("ru-RU").replace(/Ё/g, "Е");
}

function randomLetter() {
  return LETTERS[randomInt(0, LETTERS.length - 1)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]) {
  return items
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}
