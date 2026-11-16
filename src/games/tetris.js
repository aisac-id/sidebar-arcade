import { createStage, COLORS, roundRect, sfx } from "../lib/kit.js";

const COLS = 10;
const ROWS = 20;
const CELL = 17;
const BW = COLS * CELL; // 170
const OX = (320 - BW) / 2;
const OY = 30;

const SHAPES = {
  I: { m: [[1, 1, 1, 1]], c: "#4ee1ff" },
  O: { m: [[1, 1], [1, 1]], c: "#fbbf24" },
  T: { m: [[0, 1, 0], [1, 1, 1]], c: "#a78bfa" },
  S: { m: [[0, 1, 1], [1, 1, 0]], c: "#a3e635" },
  Z: { m: [[1, 1, 0], [0, 1, 1]], c: "#fb7185" },
  J: { m: [[1, 0, 0], [1, 1, 1]], c: "#60a5fa" },
  L: { m: [[0, 0, 1], [1, 1, 1]], c: "#f97316" },
};
const KEYS = Object.keys(SHAPES);

export default {
  id: "tetris",
  name: "Tetris",
  emoji: "🧱",
  tag: "Arcade",
  desc: "Susun balok, hapus baris, jangan sampai penuh.",
  bestMode: "max",
  mount(ctx) {
    const st = createStage(ctx.root, {
      w: 320,
      h: 400,
      title: "🧱 Tetris",
      subtitle: "← → gerak · ↑ putar · spasi drop",
      best: ctx.best,
      onBest: ctx.report,
    });

    let board, cur, next, score, lines, level, alive, dropAcc, moveAcc, moveDir;

    const newPiece = () => {
      const k = KEYS[Math.floor(Math.random() * KEYS.length)];
      const def = SHAPES[k];
      return {
        m: def.m.map((r) => r.slice()),
        c: def.c,
        x: Math.floor((COLS - def.m[0].length) / 2),
        y: 0,
      };
    };

    const collides = (p, ox = 0, oy = 0, mat = p.m) => {
      for (let y = 0; y < mat.length; y++) {
        for (let x = 0; x < mat[y].length; x++) {
          if (!mat[y][x]) continue;
          const bx = p.x + x + ox;
          const by = p.y + y + oy;
          if (bx < 0 || bx >= COLS || by >= ROWS) return true;
          if (by >= 0 && board[by][bx]) return true;
        }
      }
      return false;
    };

    const rotate = (m) => m[0].map((_, i) => m.map((row) => row[i]).reverse());

    const start = () => {
      board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
      score = 0;
      lines = 0;
      level = 1;
      alive = true;
      dropAcc = 0;
      moveAcc = 0;
      moveDir = 0;
      next = newPiece();
      spawn();
      st.setScore(0);
      st.hideOverlay();
    };

    const spawn = () => {
      cur = next;
      next = newPiece();
      cur.x = Math.floor((COLS - cur.m[0].length) / 2);
      cur.y = 0;
      if (collides(cur)) gameOver();
    };

    const lock = () => {
      cur.m.forEach((row, y) =>
        row.forEach((v, x) => {
          if (v && cur.y + y >= 0) board[cur.y + y][cur.x + x] = cur.c;
        })
      );
      sfx("drop");
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(Boolean)) {
          board.splice(y, 1);
          board.unshift(Array(COLS).fill(null));
          cleared++;
          y++;
        }
      }
      if (cleared) {
        const table = { 1: 100, 2: 300, 3: 500, 4: 800 };
        score += (table[cleared] || 800) * level;
        lines += cleared;
        level = 1 + Math.floor(lines / 8);
        st.setScore(score);
        sfx("point");
      }
      spawn();
    };

    const gameOver = () => {
      if (!alive) return;
      alive = false;
      ctx.report(score);
      st.end({ score, title: "Game Over", sub: `${lines} baris · level ${level}`, retry: start });
    };

    const move = (dx) => {
      if (!collides(cur, dx, 0)) cur.x += dx;
    };

    const turn = () => {
      const m = rotate(cur.m);
      const kicks = [0, -1, 1, -2, 2];
      for (const k of kicks) {
        if (!collides(cur, k, 0, m)) {
          cur.m = m;
          cur.x += k;
          sfx("flip");
          return;
        }
      }
    };

    const drop = () => {
      if (!alive) return;
      let cells = 0;
      while (!collides(cur, 0, 1)) {
        cur.y++;
        cells++;
      }
      score += cells * 2;
      st.setScore(score);
      lock();
    };

    const softStep = () => {
      if (!collides(cur, 0, 1)) cur.y++;
      else lock();
    };

    st.onKeyDown((k) => {
      if (!alive) {
        if (k === "space" || k === "enter") start();
        return;
      }
      if (k === "left") move(-1);
      else if (k === "right") move(1);
      else if (k === "up" || k === "rotate") turn();
      else if (k === "space" || k === "drop") drop();
      else if (k === "down") {
        softStep();
        score += 1;
        st.setScore(score);
      }
    });

    st.pad(["left", "rotate", "right", "down", "drop"]);

    const drawCell = (x, y, color, size, alpha = 1) => {
      const px = OX + x * CELL;
      const py = OY + y * CELL;
      st.ctx.globalAlpha = alpha;
      st.ctx.fillStyle = color;
      roundRect(st.ctx, px + 1, py + 1, CELL - 2, CELL - 2, 4);
      st.ctx.fill();
      st.ctx.globalAlpha = 1;
      st.ctx.fillStyle = "rgba(255,255,255,0.22)";
      roundRect(st.ctx, px + 2.5, py + 2.5, CELL - 5, 4, 2);
      st.ctx.fill();
    };

    const draw = () => {
      const c = st.ctx;
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, 320, 400);

      // papan
      c.fillStyle = "#0f1626";
      roundRect(c, OX - 3, OY - 3, BW + 6, ROWS * CELL + 6, 8);
      c.fill();
      c.strokeStyle = "rgba(120,160,255,0.18)";
      c.lineWidth = 1;
      roundRect(c, OX - 3, OY - 3, BW + 6, ROWS * CELL + 6, 8);
      c.stroke();

      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
          if (board[y][x]) drawCell(x, y, board[y][x]);
          else {
            c.fillStyle = "rgba(255,255,255,0.025)";
            c.fillRect(OX + x * CELL + 1, OY + y * CELL + 1, CELL - 2, CELL - 2);
          }
        }

      if (cur && alive) {
        // bayangan
        let gy = cur.y;
        while (!collides({ ...cur, y: gy }, 0, 1)) gy++;
        cur.m.forEach((row, y) =>
          row.forEach((v, x) => {
            if (v) drawCell(cur.x + x, gy + y, cur.c, CELL, 0.16);
          })
        );
        cur.m.forEach((row, y) =>
          row.forEach((v, x) => {
            if (v && cur.y + y >= 0) drawCell(cur.x + x, cur.y + y, cur.c);
          })
        );
      }

      // next
      if (next) {
        const nx = OX + BW + 12;
        c.fillStyle = COLORS.dim;
        c.font = "10px ui-monospace, monospace";
        c.fillText("NEXT", nx, OY + 4);
        next.m.forEach((row, y) =>
          row.forEach((v, x) => {
            if (!v) return;
            c.fillStyle = next.c;
            roundRect(c, nx + x * 10, OY + 12 + y * 10, 8, 8, 2);
            c.fill();
          })
        );
        c.fillStyle = COLORS.dim;
        c.font = "10px ui-monospace, monospace";
        c.fillText("LV " + level, nx, OY + 90);
        c.fillText("LINES", nx, OY + 110);
        c.fillText(String(lines), nx, OY + 124);
      }
    };

    st.loop((dt) => {
      if (alive) {
        const gravity = Math.max(0.07, 0.8 - (level - 1) * 0.07);
        dropAcc += dt;
        if (dropAcc >= gravity) {
          dropAcc = 0;
          if (!collides(cur, 0, 1)) cur.y++;
          else lock();
        }

        const held = st.isDown("left", "right");
        const dir = st.isDown("left") ? -1 : st.isDown("right") ? 1 : 0;
        if (dir !== moveDir) {
          moveDir = dir;
          moveAcc = 0;
        } else if (held) {
          moveAcc += dt;
          if (moveAcc > 0.14) {
            moveAcc = 0;
            move(dir);
          }
        }
        if (!held) moveDir = 0;
      }
      draw();
    });

    start();
    return { destroy: st.destroy };
  },
};
