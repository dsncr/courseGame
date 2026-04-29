import type { Player, Word } from "@/server/services/game.types";

type ScoreBoardProps = {
  players: Player[];
  words: Word[];
  currentPlayerId: string;
  winnerId: string | null;
};

export default function ScoreBoard({
  players,
  words,
  currentPlayerId,
  winnerId,
}: ScoreBoardProps) {
  return (
    <aside className="score-board">
      <section>
        <h2>Игроки</h2>
        <div className="player-list">
          {players.length === 0 ? (
            <p className="muted">Пока нет игроков.</p>
          ) : (
            players
              .slice()
              .sort((first, second) => second.score - first.score)
              .map((player) => (
                <div className="player-row" key={player.id}>
                  <span className="player-dot" style={{ background: player.color }} />
                  <strong>
                    {player.name}
                    {player.id === currentPlayerId ? " (вы)" : ""}
                  </strong>
                  <span>{player.score}</span>
                </div>
              ))
          )}
        </div>
        {winnerId && (
          <p className="winner">
            Победитель: {players.find((player) => player.id === winnerId)?.name}
          </p>
        )}
      </section>

      <section>
        <h2>Слова</h2>
        <div className="word-list">
          {words.map((word) => {
            const finder = word.foundBy ? players.find((p) => p.id === word.foundBy) : null;
            return (
              <span
                className={word.foundBy ? "word found-word" : "word"}
                key={word.id}
                style={finder ? { borderColor: finder.color, background: finder.color + "22" } : undefined}
              >
                {word.foundBy ? word.value : "??????".slice(0, word.value.length)}
              </span>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
