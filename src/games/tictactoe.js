import { createScreen, h, sfx } from "../lib/kit.js";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const winnerOf = (b) => {
  for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? "draw" : null;
};

const minimax = (b, turn) => {
  const w = winnerOf(b);
  if (w === "O") return { score: 10 };
  if (w === "X") return { score: -10 };
  if (w === "draw") return { score: 0 };

  let best = turn === "O" ? { score: -Infinity } : { score: Infinity };
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = turn;
    const res = minimax(b, turn === "O" ? "X" : "O");
    b[i] = null;
    const score = res.score + (turn === "O" ? -0.01 : 0.01);
    if (turn === "O" ? score > best.score : score < best.score) best = { score, move: i };
  }
  return best;
};

export default {
  id: "tictactoe",
  name: "TicTac",
  emoji: "⭕",
  tag: "Board",
  desc: "Kalahkan AI yang tidak pernah salah.",
  bestMode: "max",
  mount(ctx) {
    const ui = createScreen(ctx.root, {
      title: "⭕ Tic Tac Toe",
      subtitle: "Kamu X · AI O · skor jalan terus",
      best: ctx.best,
      onBest: ctx.report,
    });

    const status = h("p", { class: "note", text: "Giliran kamu" });
    const board = h("div", { class: "board board-ttt" });
    ui.body.append(status, board);

    let boardState, locked, session, rounds;

    const reset = () => {
      boardState = Array(9).fill(null);
      locked = false;
      session = 0;
      rounds = 0;
      ui.setScore(0);
      ui.hideOverlay();
      render();
    };

    const render = () => {
      board.innerHTML = "";
      for (let i = 0; i < 9; i++) {
        board.append(
          h(
            "button",
            {
              class: "ttt-cell" + (boardState[i] ? " v" + boardState[i] : ""),
              type: "button",
              onclick: () => play(i),
            },
            [boardState[i] || ""]
          )
        );
      }
    };

    const play = (i) => {
      if (locked || boardState[i]) return;
      boardState[i] = "X";
      sfx("flip");
      render();
      if (afterMove()) return;
      locked = true;
      status.textContent = "AI mikir…";
      setTimeout(() => {
        const empty = boardState.map((v, idx) => (v ? null : idx)).filter((v) => v !== null);
        const m = empty.length ? minimax(boardState, "O") : null;
        const pick = m && m.move !== undefined ? m.move : empty[Math.floor(Math.random() * empty.length)];
        boardState[pick] = "O";
        sfx("tick");
        render();
        if (!afterMove()) {
          locked = false;
          status.textContent = "Giliran kamu";
        }
      }, 260);
    };

    const afterMove = () => {
      const w = winnerOf(boardState);
      if (!w) return false;
      locked = true;
      rounds++;
      if (w === "X") {
        session += 100;
        sfx("win");
        ui.setScore(session);
        ctx.report(session);
        status.textContent = "Kamu menang! 🎉";
      } else if (w === "draw") {
        session += 50;
        sfx("point");
        ui.setScore(session);
        ctx.report(session);
        status.textContent = "Seri.";
      } else {
        sfx("over");
        status.textContent = "AI menang 😈";
      }
      setTimeout(
        () =>
          ui.end({
            score: session,
            title: w === "X" ? "Menang!" : w === "draw" ? "Seri" : "Kalah",
            sub: `${rounds} ronde · total ${session} poin`,
            retry: reset,
            sound: null,
          }),
        480
      );
      return true;
    };

    reset();
    return { destroy: ui.destroy };
  },
};
