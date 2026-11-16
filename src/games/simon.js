import { createScreen, h, sfx } from "../lib/kit.js";

const PADS = [
  { id: 0, color: "green" },
  { id: 1, color: "red" },
  { id: 2, color: "yellow" },
  { id: 3, color: "blue" },
];

export default {
  id: "simon",
  name: "Simon",
  emoji: "🎛️",
  tag: "Reflex",
  desc: "Ingat dan ulangi urutan warna yang menyala.",
  bestMode: "max",
  mount(ctx) {
    const ui = createScreen(ctx.root, {
      title: "🎛️ Simon",
      subtitle: "Ikuti urutan warna · tiap ronde makin panjang",
      best: ctx.best,
      onBest: ctx.report,
    });

    const status = h("p", { class: "note", text: "Siap?" });
    const board = h("div", { class: "board board-simon" });
    ui.body.append(status, board);

    let seq, level, phase, inputIndex, stopped;
    let timers = [];

    const clearTimers = () => {
      timers.forEach((t) => clearTimeout(t));
      timers = [];
    };

    const sleep = (ms) =>
      new Promise((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    const flash = (id, ms = 260) => {
      const el = board.querySelector(`[data-pad="${id}"]`);
      if (!el) return;
      el.classList.add("lit");
      sfx("tick");
      timers.push(setTimeout(() => el.classList.remove("lit"), ms));
    };

    const render = () => {
      board.innerHTML = "";
      for (const p of PADS) {
        board.append(
          h(
            "button",
            {
              class: "simon-pad " + p.color,
              type: "button",
              "data-pad": p.id,
              onclick: () => press(p.id),
            },
            [h("span", { class: "simon-dot" })]
          )
        );
      }
    };

    const reset = () => {
      clearTimers();
      render();
      seq = [];
      level = 0;
      phase = "idle";
      inputIndex = 0;
      stopped = false;
      ui.setScore(0);
      ui.hideOverlay();
      status.textContent = "Klik pad mana saja untuk mulai";
    };

    const nextRound = async () => {
      phase = "play";
      level++;
      seq.push(Math.floor(Math.random() * 4));
      inputIndex = 0;
      ui.setScore(level - 1);
      status.textContent = `Ronde ${level} · perhatikan…`;
      await sleep(420);
      for (const id of seq) {
        if (stopped) return;
        flash(id, 300);
        await sleep(430);
      }
      status.textContent = `Ronde ${level} · giliran kamu (${seq.length} langkah)`;
      phase = "input";
    };

    const press = (id) => {
      if (phase === "idle") {
        nextRound();
        return;
      }
      if (phase !== "input") return;
      flash(id, 160);
      if (seq[inputIndex] !== id) return fail();
      inputIndex++;
      if (inputIndex >= seq.length) {
        phase = "play";
        ui.setScore(level);
        ctx.report(level);
        sfx("point");
        status.textContent = "Benar! Lanjut…";
        timers.push(setTimeout(() => !stopped && nextRound(), 700));
      }
    };

    const fail = () => {
      phase = "over";
      sfx("over");
      ctx.report(level - 1);
      status.textContent = "Salah urutan 😅";
      ui.end({
        score: Math.max(0, level - 1),
        title: "Salah urutan",
        sub: `Kamu bertahan sampai ronde ${Math.max(0, level - 1)}`,
        retry: reset,
      });
    };

    reset();
    return {
      destroy: () => {
        stopped = true;
        clearTimers();
        ui.destroy();
      },
    };
  },
};
