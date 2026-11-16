import { createScreen, h, sfx, randInt } from "../lib/kit.js";

const N = 4;

function tileClass(v) {
  if (!v) return "tile empty";
  return "tile " + (v > 2048 ? "super" : "v" + v);
}

export default {
  id: "2048",
  name: "2048",
  emoji: "🔢",
  tag: "Puzzle",
  desc: "Geser dan gabungkan angka sampai 2048.",
  bestMode: "max",
  mount(ctx) {
    const ui = createScreen(ctx.root, {
      title: "🔢 2048",
      subtitle: "Panah / WASD · geser di papan",
      best: ctx.best,
      onBest: ctx.report,
    });

    const board = h("div", { class: "board board-2048" });
    ui.body.append(board);

    let grid, score, dead;

    const reset = () => {
      grid = Array.from({ length: N }, () => Array(N).fill(0));
      score = 0;
      dead = false;
      addTile();
      addTile();
      ui.setScore(0);
      ui.hideOverlay();
      render();
    };

    const empties = () => {
      const out = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!grid[y][x]) out.push([x, y]);
      return out;
    };

    const addTile = () => {
      const free = empties();
      if (!free.length) return;
      const [x, y] = free[randInt(0, free.length - 1)];
      grid[y][x] = Math.random() < 0.9 ? 2 : 4;
      return [x, y];
    };

    const render = () => {
      board.innerHTML = "";
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const v = grid[y][x];
          board.append(h("div", { class: tileClass(v), text: v ? v : "" }));
        }
      }
    };

    const slide = (line) => {
      const nums = line.filter(Boolean);
      const out = [];
      let gained = 0;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] === nums[i + 1]) {
          out.push(nums[i] * 2);
          gained += nums[i] * 2;
          i++;
        } else out.push(nums[i]);
      }
      while (out.length < N) out.push(0);
      return { line: out, gained };
    };

    const move = (dir) => {
      if (dead) return;
      let gained = 0;
      let changed = false;
      const before = JSON.stringify(grid);

      const read = (i, j) => {
        if (dir === "left") return grid[i][j];
        if (dir === "right") return grid[i][N - 1 - j];
        if (dir === "up") return grid[j][i];
        return grid[N - 1 - j][i];
      };
      const write = (i, j, v) => {
        if (dir === "left") grid[i][j] = v;
        else if (dir === "right") grid[i][N - 1 - j] = v;
        else if (dir === "up") grid[j][i] = v;
        else grid[N - 1 - j][i] = v;
      };

      for (let i = 0; i < N; i++) {
        const line = [];
        for (let j = 0; j < N; j++) line.push(read(i, j));
        const res = slide(line);
        gained += res.gained;
        for (let j = 0; j < N; j++) write(i, j, res.line[j]);
      }

      changed = JSON.stringify(grid) !== before;
      if (!changed) return;

      score += gained;
      ui.setScore(score);
      if (gained) sfx("point");
      else sfx("flip");
      addTile();
      render();

      if (grid.flat().includes(2048) && !ctx.reportedWin) {
        ctx.reportedWin = true;
        sfx("win");
        ui.end({ score, title: "2048! 🎉", sub: "Kamu berhasil. Lanjut lagi?", retry: reset, sound: null });
        dead = true;
        ctx.report(score);
        return;
      }

      if (!canMove()) {
        dead = true;
        ctx.report(score);
        ui.end({ score, title: "Game Over", sub: "Tidak ada langkah tersisa.", retry: reset });
      }
    };

    const canMove = () => {
      if (empties().length) return true;
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const v = grid[y][x];
          if (x < N - 1 && grid[y][x + 1] === v) return true;
          if (y < N - 1 && grid[y + 1][x] === v) return true;
        }
      return false;
    };

    const onKey = (e) => {
      const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      move(dir);
    };
    window.addEventListener("keydown", onKey);

    let sx = 0;
    let sy = 0;
    board.addEventListener("pointerdown", (e) => {
      sx = e.clientX;
      sy = e.clientY;
    });
    board.addEventListener("pointerup", (e) => {
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    });

    reset();
    return {
      destroy: () => {
        window.removeEventListener("keydown", onKey);
        ui.destroy();
      },
    };
  },
};
