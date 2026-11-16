import { createScreen, h, sfx } from "../lib/kit.js";

const TIME = 30;

export default {
  id: "whack",
  name: "Whack",
  emoji: "🔨",
  tag: "Reflex",
  desc: "Pukul tikus, hindari bom, kejar skor 30 detik.",
  bestMode: "max",
  mount(ctx) {
    const ui = createScreen(ctx.root, {
      title: "🔨 Whack-a-Mole",
      subtitle: `Pukul tikus +10 · bom −15 · ${TIME} detik`,
      best: ctx.best,
      onBest: ctx.report,
    });

    const status = h("p", { class: "note", text: "Siap?" });
    const board = h("div", { class: "board board-whack" });
    ui.body.append(status, board);

    let score, timeLeft, running, spawnTimer, clockTimer, moles;

    const reset = () => {
      score = 0;
      timeLeft = TIME;
      running = false;
      moles = Array(9).fill(null);
      clearInterval(spawnTimer);
      clearInterval(clockTimer);
      ui.setScore(0);
      ui.hideOverlay();
      status.textContent = "Klik tikus secepat mungkin!";
      render();
      start();
    };

    const render = () => {
      board.innerHTML = "";
      for (let i = 0; i < 9; i++) {
        const mole = moles[i];
        const btn = h(
          "button",
          {
            class: "hole" + (mole ? " up" : ""),
            type: "button",
            onclick: () => hit(i),
          },
          [h("span", { class: "hole-inner", text: mole === "bomb" ? "💣" : mole ? "🐹" : "" })]
        );
        board.append(btn);
      }
    };

    const hit = (i) => {
      if (!running || !moles[i]) return;
      if (moles[i] === "bomb") {
        score = Math.max(0, score - 15);
        sfx("hit");
      } else {
        score += 10;
        sfx("point");
      }
      moles[i] = null;
      ui.setScore(score);
      render();
    };

    const pop = () => {
      if (!running) return;
      const free = moles.map((v, i) => (v ? null : i)).filter((v) => v !== null);
      if (!free.length) return;
      const i = free[Math.floor(Math.random() * free.length)];
      moles[i] = Math.random() < 0.16 ? "bomb" : "mole";
      render();
      setTimeout(() => {
        if (running && moles[i]) {
          moles[i] = null;
          render();
        }
      }, 900);
    };

    const start = () => {
      running = true;
      const speed = 780;
      spawnTimer = setInterval(pop, speed);
      clockTimer = setInterval(() => {
        timeLeft--;
        status.textContent = `⏱️ ${timeLeft}s · skor ${score}`;
        if (timeLeft <= 5 && timeLeft > 0) sfx("tick");
        if (timeLeft <= 0) stop();
      }, 1000);
      pop();
      pop();
    };

    const stop = () => {
      running = false;
      clearInterval(spawnTimer);
      clearInterval(clockTimer);
      moles = Array(9).fill(null);
      render();
      ctx.report(score);
      ui.end({ score, title: "Waktu habis!", sub: `Skor ${score}`, retry: reset });
    };

    reset();
    return {
      destroy: () => {
        running = false;
        clearInterval(spawnTimer);
        clearInterval(clockTimer);
        ui.destroy();
      },
    };
  },
};
