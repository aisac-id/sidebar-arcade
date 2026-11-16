import { createScreen, h, sfx } from "../lib/kit.js";

const COLS = 7;
const ROWS = 6;
const EMPTY = 0;
const P1 = 1; // kamu
const AI = 2;

export default {
  id: "connect4",
  name: "Connect4",
  emoji: "🔴",
  tag: "Board",
  desc: "Susun 4 cakram sejajar sebelum AI.",
  bestMode: "max",
  mount(ctx) {
    const ui = createScreen(ctx.root, {
      title: "🔴 Connect 4",
      subtitle: "Klik kolom · kamu kuning, AI merah",
      best: ctx.best,
      onBest: ctx.report,
    });

    const status = h("p", { class: "note", text: "Giliran kamu" });
    const boardEl = h("div", { class: "board board-c4" });
    ui.body.append(status, boardEl);

    let grid, locked, session, rounds;

    const reset = () => {
      grid = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
      locked = false;
      session = 0;
      rounds = 0;
      ui.setScore(0);
      ui.hideOverlay();
      render();
      status.textContent = "Giliran kamu";
    };

    const render = () => {
      boardEl.innerHTML = "";
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const v = grid[y][x];
          boardEl.append(
            h("button", {
              class: "c4-cell" + (v === P1 ? " p1" : v === AI ? " ai" : ""),
              type: "button",
              onclick: () => drop(x),
            })
          );
        }
      }
    };

    const dropRow = (x) => {
      for (let y = ROWS - 1; y >= 0; y--) if (grid[y][x] === EMPTY) return y;
      return -1;
    };

    const drop = (x) => {
      if (locked) return;
      const y = dropRow(x);
      if (y < 0) return;
      grid[y][x] = P1;
      sfx("drop");
      render();
      if (checkEnd()) return;
      locked = true;
      status.textContent = "AI mikir…";
      setTimeout(() => {
        const best = aiMove();
        grid[best.y][best.x] = AI;
        sfx("flip");
        render();
        if (!checkEnd()) {
          locked = false;
          status.textContent = "Giliran kamu";
        }
      }, 280);
    };

    const wins = (g, who) => {
      const at = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS ? g[y][x] : -1);
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          if (at(x, y) !== who) continue;
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
            [1, 1],
            [1, -1],
          ]) {
            if ([1, 2, 3].every((k) => at(x + dx * k, y + dy * k) === who)) return true;
          }
        }
      return false;
    };

    const full = (g) => g[0].every((v) => v !== EMPTY);

    const checkEnd = () => {
      if (wins(grid, P1)) return finish("win");
      if (wins(grid, AI)) return finish("lose");
      if (full(grid)) return finish("draw");
      return false;
    };

    const finish = (result) => {
      locked = true;
      rounds++;
      if (result === "win") {
        session += 100;
        sfx("win");
        status.textContent = "Kamu menang! 🎉";
      } else if (result === "draw") {
        session += 50;
        sfx("point");
        status.textContent = "Seri.";
      } else {
        sfx("over");
        status.textContent = "AI menang 😈";
      }
      if (result !== "lose") {
        ui.setScore(session);
        ctx.report(session);
      }
      setTimeout(
        () =>
          ui.end({
            score: session,
            title: result === "win" ? "Menang!" : result === "draw" ? "Seri" : "Kalah",
            sub: `${rounds} ronde · total ${session} poin`,
            retry: reset,
            sound: null,
          }),
        520
      );
      return true;
    };

    /* ---------- AI: minimax sederhana kedalaman 4 ---------- */
    const aiMove = () => {
      const options = [];
      for (let x = 0; x < COLS; x++) {
        const y = dropRow(x);
        if (y >= 0) options.push({ x, y });
      }
      // menang langsung?
      for (const o of options) {
        grid[o.y][o.x] = AI;
        const w = wins(grid, AI);
        grid[o.y][o.x] = EMPTY;
        if (w) return o;
      }
      // blokir?
      for (const o of options) {
        grid[o.y][o.x] = P1;
        const w = wins(grid, P1);
        grid[o.y][o.x] = EMPTY;
        if (w) return o;
      }

      let best = null;
      for (const o of options) {
        grid[o.y][o.x] = AI;
        const score = scoreBoard(grid, 3, -Infinity, Infinity, false);
        grid[o.y][o.x] = EMPTY;
        const bonus = 3 - Math.abs(3 - o.x);
        const total = score + bonus * 2;
        if (!best || total > best.total) best = { ...o, total };
      }
      return best || options[0];
    };

    const scoreBoard = (g, depth, alpha, beta, maximizing) => {
      if (wins(g, AI)) return 1000 + depth;
      if (wins(g, P1)) return -1000 - depth;
      if (full(g) || depth === 0) return heuristic(g);
      if (maximizing) {
        let v = -Infinity;
        for (let x = 0; x < COLS; x++) {
          const y = dropRow(x);
          if (y < 0) continue;
          g[y][x] = AI;
          v = Math.max(v, scoreBoard(g, depth - 1, alpha, beta, false));
          g[y][x] = EMPTY;
          alpha = Math.max(alpha, v);
          if (beta <= alpha) break;
        }
        return v;
      }
      let v = Infinity;
      for (let x = 0; x < COLS; x++) {
        const y = dropRow(x);
        if (y < 0) continue;
        g[y][x] = P1;
        v = Math.min(v, scoreBoard(g, depth - 1, alpha, beta, true));
        g[y][x] = EMPTY;
        beta = Math.min(beta, v);
        if (beta <= alpha) break;
      }
      return v;
    };

    const heuristic = (g) => {
      const at = (x, y) => (x >= 0 && x < COLS && y >= 0 && y < ROWS ? g[y][x] : -1);
      let score = 0;
      const dirs = [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, -1],
      ];
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          for (const [dx, dy] of dirs) {
            const win = [0, 1, 2, 3].map((k) => at(x + dx * k, y + dy * k));
            if (win.includes(-1)) continue;
            const ai = win.filter((v) => v === AI).length;
            const p1 = win.filter((v) => v === P1).length;
            if (ai && !p1) score += [0, 1, 12, 90][ai];
            if (p1 && !ai) score -= [0, 1, 14, 100][p1];
          }
        }
      return score;
    };

    reset();
    return { destroy: ui.destroy };
  },
};
