import { createScreen, h, sfx } from "../lib/kit.js";

const N = 9;
const MINES = 10;

export default {
  id: "mines",
  name: "Mines",
  emoji: "💣",
  tag: "Puzzle",
  desc: "Buka semua kotak aman tanpa kena ranjau.",
  bestMode: "max",
  mount(ctx) {
    const ui = createScreen(ctx.root, {
      title: "💣 Minesweeper",
      subtitle: "Klik buka · klik kanan / tahan untuk 🚩",
      best: ctx.best,
      onBest: ctx.report,
    });

    const top = h("div", { class: "toolbar" }, [
      h("span", { class: "note js-mines", text: `💣 ${MINES}` }),
      h("span", { class: "note js-time", text: "⏱️ 0s" }),
    ]);
    const grid = h("div", { class: "board board-mines" });
    ui.body.append(top, grid);

    let cells, dead, flags, opened, startedAt, timer, done;

    const reset = () => {
      cells = Array.from({ length: N * N }, (_, i) => ({
        i,
        mine: false,
        count: 0,
        open: false,
        flag: false,
      }));
      dead = false;
      done = false;
      flags = 0;
      opened = 0;
      startedAt = 0;
      clearInterval(timer);
      timer = null;
      ui.setScore(0);
      ui.hideOverlay();
      top.querySelector(".js-mines").textContent = `💣 ${MINES}`;
      top.querySelector(".js-time").textContent = "⏱️ 0s";
      render();
    };

    const neighbors = (i) => {
      const x = i % N;
      const y = Math.floor(i / N);
      const out = [];
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < N && ny >= 0 && ny < N) out.push(ny * N + nx);
        }
      return out;
    };

    const plant = (safeIndex) => {
      const banned = new Set([safeIndex, ...neighbors(safeIndex)]);
      let placed = 0;
      while (placed < MINES) {
        const i = Math.floor(Math.random() * N * N);
        if (banned.has(i) || cells[i].mine) continue;
        cells[i].mine = true;
        placed++;
      }
      for (const cell of cells) {
        if (!cell.mine) cell.count = neighbors(cell.i).filter((j) => cells[j].mine).length;
      }
      startedAt = Date.now();
      timer = setInterval(() => {
        const s = Math.floor((Date.now() - startedAt) / 1000);
        top.querySelector(".js-time").textContent = `⏱️ ${s}s`;
      }, 500);
    };

    const reveal = (i) => {
      const cell = cells[i];
      if (cell.open || cell.flag || dead || done) return;
      if (!startedAt) plant(i);
      cell.open = true;
      opened++;
      if (cell.mine) return boom(i);
      if (cell.count === 0) neighbors(i).forEach(reveal);
    };

    const boom = (i) => {
      dead = true;
      clearInterval(timer);
      cells.forEach((c) => {
        if (c.mine) c.open = true;
      });
      sfx("hit");
      render();
      ctx.report(0);
      ui.end({ score: 0, title: "Boom! 💥", sub: "Kena ranjau. Coba lagi?", retry: reset });
    };

    const toggleFlag = (i) => {
      const cell = cells[i];
      if (cell.open || dead || done) return;
      if (!cell.flag && flags >= MINES) return;
      cell.flag = !cell.flag;
      flags += cell.flag ? 1 : -1;
      sfx("flip");
      top.querySelector(".js-mines").textContent = `💣 ${MINES - flags}`;
      render();
    };

    const checkWin = () => {
      if (done || dead) return;
      if (opened === N * N - MINES) {
        done = true;
        clearInterval(timer);
        const secs = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
        const score = Math.max(100, 1000 - secs * 10);
        ctx.report(score);
        ui.end({ score, title: "Bersih! 🎉", sub: `${secs} detik · skor ${score}`, retry: reset, sound: "win" });
      }
    };

    const render = () => {
      grid.innerHTML = "";
      for (const cell of cells) {
        const cls = ["ms-cell"];
        if (cell.open) cls.push("open");
        if (cell.open && cell.mine) cls.push("mine");
        if (cell.flag) cls.push("flag");
        const label = cell.open ? (cell.mine ? "💣" : cell.count || "") : cell.flag ? "🚩" : "";
        const btn = h(
          "button",
          {
            class: cls.join(" "),
            type: "button",
            "data-n": cell.open && cell.count ? cell.count : "",
            oncontextmenu: (e) => {
              e.preventDefault();
              toggleFlag(cell.i);
            },
          },
          [label]
        );

        let longPressed = false;
        btn.addEventListener("click", () => {
          if (longPressed) {
            longPressed = false;
            return;
          }
          if (dead || done) return;
          reveal(cell.i);
          if (!dead) {
            ui.setScore(opened);
            render();
            checkWin();
          }
        });
        if (!cell.open) {
          attachLongPress(btn, () => {
            longPressed = true;
            toggleFlag(cell.i);
          });
        }
        grid.append(btn);
      }
    };

    const attachLongPress = (el, fn) => {
      let t = null;
      let start = null;
      el.addEventListener("pointerdown", (e) => {
        start = { x: e.clientX, y: e.clientY };
        t = setTimeout(() => {
          t = null;
          fn();
        }, 380);
      });
      const clear = () => {
        if (t) clearTimeout(t);
        t = null;
        start = null;
      };
      el.addEventListener("pointermove", (e) => {
        if (!start) return;
        if (Math.abs(e.clientX - start.x) > 12 || Math.abs(e.clientY - start.y) > 12) clear();
      });
      el.addEventListener("pointerup", clear);
      el.addEventListener("pointerleave", clear);
      el.addEventListener("pointercancel", clear);
    };

    reset();
    return {
      destroy: () => {
        clearInterval(timer);
        ui.destroy();
      },
    };
  },
};
