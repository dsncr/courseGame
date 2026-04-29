import { describe, expect, it } from "vitest";
import { generateGrid, readWord } from "./grid.service";

const TEST_WORDS = ["ДИЗАЙН", "ГРАФИКА", "ПИКСЕЛЬ", "КАДР", "МОДЕЛЬ"];

describe("generateGrid", () => {
  it("creates a 10x10 grid", () => {
    const result = generateGrid(TEST_WORDS);
    expect(result.cells).toHaveLength(10);
    for (const row of result.cells) {
      expect(row).toHaveLength(10);
    }
  });

  it("places at least some words", () => {
    const result = generateGrid(TEST_WORDS);
    expect(result.words.length).toBeGreaterThan(0);
  });

  it("placed words exist on grid", () => {
    const result = generateGrid(TEST_WORDS);
    for (const word of result.words) {
      const read = readWord(result.cells, word.coordinates);
      expect(read).toBe(word.value);
    }
  });

  it("fills empty cells with letters", () => {
    const result = generateGrid(TEST_WORDS);
    for (const row of result.cells) {
      for (const cell of row) {
        expect(cell).toMatch(/^[А-Я]$/);
      }
    }
  });
});

describe("readWord", () => {
  it("reads word from coordinates", () => {
    const cells = [
      ["Д", "И", "З"],
      ["А", "Й", "Н"],
      ["Г", "Р", "А"],
    ];
    const coordinates = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ];
    expect(readWord(cells, coordinates)).toBe("ДИЗ");
  });
});
