import type { Coordinate, StoredMatch, Word } from "./game.types";
import { readWord } from "./grid.service";

export type WordCheckResult =
  | { success: true; word: Word }
  | { success: false; error: string };

export function checkSubmittedWord(
  storedMatch: StoredMatch,
  value: string,
  coordinates: Coordinate[],
): WordCheckResult {
  const normalizedValue = value.trim().toLocaleUpperCase("ru-RU").replace(/Ё/g, "Е");
  const targetWord = storedMatch.words.find((word) => word.value === normalizedValue);

  if (!targetWord) {
    return { success: false, error: "Слова нет в словаре матча." };
  }

  if (targetWord.foundBy) {
    return { success: false, error: "Это слово уже найдено." };
  }

  const selectedWord = readWord(storedMatch.grid.cells, coordinates);
  const reversedSelectedWord = readWord(storedMatch.grid.cells, [...coordinates].reverse());

  if (selectedWord !== normalizedValue && reversedSelectedWord !== normalizedValue) {
    return {
      success: false,
      error: "Выделенные клетки не соответствуют слову.",
    };
  }

  if (!samePath(targetWord.coordinates, coordinates)) {
    return { success: false, error: "Слово есть, но путь выбран неверно." };
  }

  return { success: true, word: targetWord };
}

function samePath(expected: Coordinate[], actual: Coordinate[]) {
  const actualKey = toKey(actual);
  return actualKey === toKey(expected) || actualKey === toKey([...expected].reverse());
}

function toKey(coordinates: Coordinate[]) {
  return coordinates.map((coordinate) => `${coordinate.x}:${coordinate.y}`).join("|");
}
