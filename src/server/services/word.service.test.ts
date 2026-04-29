import { describe, expect, it } from "vitest";
import { checkSubmittedWord } from "./word.service";
import type { StoredMatch } from "./game.types";

function makeStoredMatch(overrides?: Partial<StoredMatch>): StoredMatch {
  return {
    match: {
      id: "match_test",
      status: "playing",
      maxPlayers: 2,
      createdAt: new Date(),
      startedAt: new Date(),
      finishedAt: null,
      duration: 180,
      finishedReason: null,
      surrenderedBy: null,
      surrenderedByName: null,
      surrenderedByImage: null,
    },
    grid: {
      matchId: "match_test",
      cells: [
        ["Д", "И", "З", "А", "Й", "Н", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", ""],
      ],
    },
    players: [
      {
        id: "player_1",
        userId: "user_1",
        matchId: "match_test",
        name: "Игрок 1",
        score: 0,
        color: "#000",
        joinedAt: new Date(),
        foundWordTimes: [],
      },
    ],
    words: [
      {
        id: "word_1",
        matchId: "match_test",
        value: "ДИЗАЙН",
        coordinates: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
          { x: 5, y: 0 },
        ],
        foundBy: null,
        foundAt: null,
      },
    ],
    ...overrides,
  } as StoredMatch;
}

describe("checkSubmittedWord", () => {
  it("accepts correct word with correct path", () => {
    const storedMatch = makeStoredMatch();
    const result = checkSubmittedWord(storedMatch, "ДИЗАЙН", [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.word.value).toBe("ДИЗАЙН");
    }
  });

  it("accepts reversed path", () => {
    const storedMatch = makeStoredMatch();
    const result = checkSubmittedWord(storedMatch, "ДИЗАЙН", [
      { x: 5, y: 0 },
      { x: 4, y: 0 },
      { x: 3, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0 },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects word not in dictionary", () => {
    const storedMatch = makeStoredMatch();
    const result = checkSubmittedWord(storedMatch, "НЕТУ", [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Слова нет в словаре");
    }
  });

  it("rejects already found word", () => {
    const storedMatch = makeStoredMatch({
      words: [
        {
          id: "word_1",
          matchId: "match_test",
          value: "ДИЗАЙН",
          coordinates: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 3, y: 0 },
            { x: 4, y: 0 },
            { x: 5, y: 0 },
          ],
          foundBy: "player_1",
          foundAt: new Date(),
        },
      ],
    });
    const result = checkSubmittedWord(storedMatch, "ДИЗАЙН", [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("уже найдено");
    }
  });

  it("rejects wrong path", () => {
    const storedMatch = makeStoredMatch();
    const result = checkSubmittedWord(storedMatch, "ДИЗАЙН", [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Выделенные клетки не соответствуют слову");
    }
  });
});
