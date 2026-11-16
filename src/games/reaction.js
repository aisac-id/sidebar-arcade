import { createScreen, h, sfx, rand } from "../lib/kit.js";

// Skor = waktu reaksi (ms). Makin kecil makin bagus.
export default {
  id: "reaction",
  name: "Reaction",
  emoji: "⚡",
  tag: "Reflex",
  desc: "Uji refleks: klik tepat saat layar jadi hijau.",
  bestMode: "min",
  mount(ctx) {
    const ui = createScreen(ctx.root, {
      title: "⚡ Reaction Test",
      subtitle: "Klik saat hijau · 5 percobaan",
      best: ctx.best,
      onBest: ctx.report,
    });

    const pad = h("button", { class: "reaction-pad idle", type: "button" });
    const label = h("span", { class: "reaction-label", text: "Tap untuk mulai" });
    pad.append(label);
    const note = h("p", { class: "note", text: "Jangan klik sebelum hijau. 😉" });
    ui.body.append(pad, note);

    let state = "idle"; // idle | wait | go | result
    let timer = null;
    let shownAt = 0;
    let attempt = 0;
    let bestRound = null;
    let total = 0;

    const setState = (s, text, cls) => {
      state = s;
      label.textContent = text;
      pad.className = "reaction-pad " + (cls || s);
    };

    const startRound = () => {
      if (attempt >= 5) return reset();
      setState("wait", "Tunggu…", "wait");
      clearTimeout(timer);
      timer = setTimeout(() => {
        shownAt = performance.now();
        setState("go", "KLIK!", "go");
        sfx("tick");
      }, rand(1100, 3200));
    };

    const tap = () => {
      if (state === "idle" || state === "result") {
        if (state === "result") {
          if (attempt >= 5) return reset();
          startRound();
        } else {
          attempt = 0;
          total = 0;
          startRound();
        }
        return;
      }
      if (state === "wait") {
        clearTimeout(timer);
        sfx("hit");
        setState("result", "Terlalu cepat! Klik untuk coba lagi", "bad");
        note.textContent = "Kamu klik sebelum hijau — percobaan diulang.";
        return;
      }
      if (state === "go") {
        const ms = Math.round(performance.now() - shownAt);
        attempt++;
        total += ms;
        bestRound = bestRound === null ? ms : Math.min(bestRound, ms);
        ui.setScore(ms);
        ctx.report(ms);
        sfx(ms < 250 ? "win" : "point");
        note.textContent = `Percobaan ${attempt}/5 · terbaik ${bestRound} ms`;
        if (attempt >= 5) {
          const avg = Math.round(total / 5);
          setState("result", `${avg} ms rata-rata`, "result");
          ui.end({
            score: bestRound,
            title: "Selesai!",
            sub: `Terbaik ${bestRound} ms · rata-rata ${avg} ms`,
            retry: reset,
            sound: "win",
          });
        } else {
          setState("result", `${ms} ms · klik untuk lanjut`, "result");
        }
      }
    };

    const reset = () => {
      clearTimeout(timer);
      attempt = 0;
      total = 0;
      bestRound = null;
      ui.setScore(0);
      ui.hideOverlay();
      note.textContent = "Jangan klik sebelum hijau. 😉";
      setState("idle", "Tap untuk mulai", "idle");
    };

    pad.addEventListener("click", tap);

    setState("idle", "Tap untuk mulai", "idle");
    return {
      destroy: () => {
        clearTimeout(timer);
        ui.destroy();
      },
    };
  },
};
