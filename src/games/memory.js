import { createScreen, h, sfx } from "../lib/kit.js";

const ICONS = ["🚀", "🍕", "🎧", "🌙", "🐙", "🍩", "⚡", "🎲"];
const PAIRS = 8;

export default {
  id: "memory",
  name: "Memory",
  emoji: "🧠",
  tag: "Puzzle",
  desc: "Balik kartu dan temukan pasangan yang sama.",
  bestMode: "max",
  mount(ctx) {
    const ui = createScreen(ctx.root, {
      title: "🧠 Memory Match",
      subtitle: "Cocokkan 8 pasang kartu · makin sedikit langkah makin tinggi skor",
      best: ctx.best,
      onBest: ctx.report,
    });

    const grid = h("div", { class: "board board-memory" });
    const note = h("p", { class: "note", text: "Langkah: 0" });
    ui.body.append(grid, note);

    let cards, first, lock, moves, found, done;

    const reset = () => {
      cards = shuffle([...ICONS, ...ICONS]).map((icon, i) => ({ i, icon, open: false, done: false }));
      first = null;
      lock = false;
      moves = 0;
      found = 0;
      done = false;
      ui.setScore(0);
      ui.hideOverlay();
      render();
    };

    const render = () => {
      grid.innerHTML = "";
      for (const card of cards) {
        const btn = h("button", {
          class: "card" + (card.open || card.done ? " open" : "") + (card.done ? " done" : ""),
          type: "button",
          onclick: () => flip(card),
        }, [h("span", { text: card.open || card.done ? card.icon : "" })]);
        grid.append(btn);
      }
      note.textContent = `Langkah: ${moves}`;
    };

    const flip = (card) => {
      if (lock || done || card.open || card.done) return;
      card.open = true;
      sfx("flip");
      render();
      if (!first) {
        first = card;
        return;
      }
      moves++;
      if (first.icon === card.icon) {
        first.done = true;
        card.done = true;
        first = null;
        found++;
        ui.setScore(found * 10);
        sfx("point");
        render();
        if (found === PAIRS) finish();
      } else {
        lock = true;
        const a = first;
        first = null;
        setTimeout(() => {
          a.open = false;
          card.open = false;
          lock = false;
          render();
        }, 620);
      }
    };

    const finish = () => {
      done = true;
      const score = Math.max(100, 1200 - moves * 25);
      ui.setScore(found * 10);
      ctx.report(score);
      setTimeout(
        () => ui.end({ score, title: "Semua ketemu! 🎉", sub: `${moves} langkah`, retry: reset, sound: "win" }),
        420
      );
    };

    reset();
    return { destroy: ui.destroy };
  },
};

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
