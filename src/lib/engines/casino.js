// Kumpulan game keberuntungan (dingdong): slot, roulette, dadu, plinko,
// roda putar, koin, keno, kartu gosok, bingo. Semua pakai kredit virtual.
import { createScreen, createStage, h, clamp, rand, randInt, pick, sfx, fmt, roundRect } from "../kit.js";

export function shell(ctx, cfg) {
  const scr = createScreen(ctx.root, {
    title: cfg.title,
    subtitle: cfg.subtitle,
    best: ctx.best,
    bestMode: "max",
    onBest: ctx.report,
  });
  const wrap = h("div", { class: "casino" });
  const creditsEl = h("b", { text: fmt(cfg.credits ?? 100) });
  const hud = h("div", { class: "casino-credits" }, [
    h("span", { class: "chip" }, [h("i", { text: "KREDIT" }), creditsEl]),
  ]);
  const msg = h("p", { class: "casino-msg", text: cfg.hint || "Pilih dan tekan tombol." });
  wrap.append(hud, msg);
  scr.body.append(wrap);

  let credits = cfg.credits ?? 100;
  const game = {
    scr,
    wrap,
    hud,
    msg,
    get credits() {
      return credits;
    },
    setCredits(v) {
      credits = Math.max(0, Math.round(v));
      creditsEl.textContent = fmt(credits);
      scr.setScore(credits);
    },
    add(v) {
      game.setCredits(credits + v);
    },
    take(n) {
      if (credits < n) {
        game.say("Kredit tidak cukup. Reset dulu ya.", "lose");
        return false;
      }
      game.setCredits(credits - n);
      return true;
    },
    say(text, kind = "") {
      msg.textContent = text;
      msg.className = "casino-msg " + kind;
    },
  };
  game.setCredits(credits);
  return game;
}

export function betRow(bet, opts = {}) {
  const min = opts.min ?? 5;
  const max = opts.max ?? 50;
  const step = opts.step ?? 5;
  const label = h("b", { class: "bet-value", text: String(bet.value) });
  const set = (v) => {
    bet.value = clamp(v, min, max);
    label.textContent = String(bet.value);
  };
  const row = h("div", { class: "casino-bet" }, [
    h("span", { class: "bet-label", text: "Taruhan" }),
    h("button", {
      class: "bet-btn",
      type: "button",
      text: "−",
      onclick: () => {
        sfx("click");
        set(bet.value - step);
      },
    }),
    label,
    h("button", {
      class: "bet-btn",
      type: "button",
      text: "+",
      onclick: () => {
        sfx("click");
        set(bet.value + step);
      },
    }),
  ]);
  return { row, set };
}

function resetBtn(fn) {
  return h("button", {
    class: "btn ghost tiny",
    type: "button",
    text: "Reset kredit",
    onclick: () => {
      sfx("click");
      fn();
    },
  });
}

/* --------------------------------- SLOT ---------------------------------- */
export function createSlots(ctx, cfg = {}) {
  const game = shell(ctx, cfg);
  const bet = { value: 10 };
  const symbols = cfg.symbols || ["🍒", "🍋", "🔔", "⭐", "7️⃣", "💎"];
  const pays = cfg.pays || [5, 6, 8, 12, 20, 32];

  const reelEls = [0, 1, 2].map(() => h("div", { class: "reel" }, [h("span", { text: "❔" })]));
  const reels = h("div", { class: "reels" }, reelEls);
  const betUi = betRow(bet);
  const spinBtn = h("button", { class: "btn primary", type: "button", text: "PUTAR" });
  const payTable = h("p", {
    class: "pay-table",
    text: "3 sama: 5x–32x taruhan · 2 sama: 2x",
  });
  game.wrap.append(reels, betUi.row, spinBtn, payTable, resetBtn(() => game.setCredits(100)));

  let busy = false;
  const timers = [];

  function spin() {
    if (busy) return;
    if (!game.take(bet.value)) return;
    busy = true;
    spinBtn.disabled = true;
    game.say("Putar...");
    reelEls.forEach((el) => el.classList.add("spin"));
    const result = [randInt(0, symbols.length - 1), randInt(0, symbols.length - 1), randInt(0, symbols.length - 1)];
    [380, 560, 760].forEach((delay, i) => {
      const id = setInterval(() => {
        const el = reelEls[i].firstChild;
        el.textContent = symbols[randInt(0, symbols.length - 1)];
      }, 60);
      timers.push(id);
      timers.push(
        setTimeout(() => {
          clearInterval(id);
          reelEls[i].classList.remove("spin");
          reelEls[i].firstChild.textContent = symbols[result[i]];
          sfx("tick");
          if (i === 2) settle(result);
        }, delay)
      );
    });
  }

  function settle(result) {
    let mult = 0;
    let label = "Tidak ada yang cocok.";
    if (result[0] === result[1] && result[1] === result[2]) {
      mult = pays[result[0]] || 10;
      label = `JACKPOT! ${symbols[result[0]]} x3 → ${mult}x`;
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      mult = 2;
      label = "Dua sama → 2x";
    }
    const win = Math.round(bet.value * mult);
    if (win > 0) {
      game.add(win);
      game.say(`${label} (+${win})`, "win");
      sfx("win");
    } else {
      game.say(label, "lose");
      sfx("over");
    }
    busy = false;
    spinBtn.disabled = false;
  }

  spinBtn.addEventListener("click", spin);
  return {
    destroy() {
      timers.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
      game.scr.destroy();
    },
  };
}

/* -------------------------------- ROULETTE ------------------------------- */
export function createRoulette(ctx, cfg = {}) {
  const game = shell(ctx, cfg);
  const bet = { value: 10 };
  const choices = [
    { id: "red", label: "MERAH", mult: 2, cls: "red" },
    { id: "black", label: "HITAM", mult: 2, cls: "black" },
    { id: "green", label: "NOL", mult: 36, cls: "green" },
    { id: "odd", label: "GANJIL", mult: 2, cls: "alt" },
    { id: "even", label: "GENAP", mult: 2, cls: "alt" },
    { id: "low", label: "1–18", mult: 2, cls: "alt" },
    { id: "high", label: "19–36", mult: 2, cls: "alt" },
  ];
  const picked = { id: "red" };
  const numberEl = h("div", { class: "roulette-number", text: "—" });
  const history = h("div", { class: "roulette-history" });
  const betUi = betRow(bet);

  const table = h("div", { class: "roulette-table" },
    choices.map((c) =>
      h("button", {
        class: "roulette-bet " + c.cls + (c.id === picked.id ? " active" : ""),
        type: "button",
        text: c.label,
        onclick: (e) => {
          picked.id = c.id;
          table.querySelectorAll(".roulette-bet").forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
          sfx("click");
        },
      })
    )
  );
  const spinBtn = h("button", { class: "btn primary", type: "button", text: "PUTAR RODA" });
  game.wrap.append(numberEl, table, betUi.row, spinBtn, history, resetBtn(() => game.setCredits(100)));

  let busy = false;
  const timers = [];
  function spin() {
    if (busy) return;
    if (!game.take(bet.value)) return;
    busy = true;
    spinBtn.disabled = true;
    game.say("Bola berputar...");
    let ticks = 0;
    const anim = setInterval(() => {
      numberEl.textContent = String(randInt(0, 36));
      ticks++;
      if (ticks > 14) {
        clearInterval(anim);
        finish();
      }
    }, 55);
    timers.push(anim);

    function finish() {
      const n = randInt(0, 36);
      const color = n === 0 ? "green" : n % 2 === 0 ? "black" : "red";
      numberEl.textContent = String(n);
      numberEl.className = "roulette-number " + color;
      history.prepend(h("span", { class: "roulette-dot " + color, text: String(n) }));
      if (history.children.length > 10) history.lastChild.remove();
      const c = choices.find((x) => x.id === picked.id);
      let winFlag = false;
      if (picked.id === "red") winFlag = color === "red";
      else if (picked.id === "black") winFlag = color === "black";
      else if (picked.id === "green") winFlag = n === 0;
      else if (picked.id === "odd") winFlag = n > 0 && n % 2 === 1;
      else if (picked.id === "even") winFlag = n > 0 && n % 2 === 0;
      else if (picked.id === "low") winFlag = n >= 1 && n <= 18;
      else if (picked.id === "high") winFlag = n >= 19 && n <= 36;
      if (winFlag) {
        const win = Math.round(bet.value * c.mult);
        game.add(win);
        game.say(`Menang! ${c.label} (+${win})`, "win");
        sfx("win");
      } else {
        game.say(`Kalah. Keluar ${n} ${color}.`, "lose");
        sfx("over");
      }
      busy = false;
      spinBtn.disabled = false;
    }
  }
  spinBtn.addEventListener("click", spin);
  return {
    destroy() {
      timers.forEach((t) => clearInterval(t));
      game.scr.destroy();
    },
  };
}

/* --------------------------------- DADU --------------------------------- */
export function createDice(ctx, cfg = {}) {
  const game = shell(ctx, cfg);
  const bet = { value: 10 };
  const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const diceEls = [h("span", { class: "die", text: "⚀" }), h("span", { class: "die", text: "⚀" })];
  const dice = h("div", { class: "dice-row" }, diceEls);
  const totalEl = h("div", { class: "dice-total", text: "—" });
  const betUi = betRow(bet);
  const picked = { id: "over" };
  const opts = [
    { id: "over", label: "BESAR (8–12)", mult: 2 },
    { id: "under", label: "KECIL (2–6)", mult: 2 },
    { id: "seven", label: "TEPAT 7", mult: 5 },
  ];
  const row = h("div", { class: "chip-row" },
    opts.map((o) =>
      h("button", {
        class: "casino-choice" + (o.id === picked.id ? " active" : ""),
        type: "button",
        text: o.label,
        onclick: (e) => {
          picked.id = o.id;
          row.querySelectorAll(".casino-choice").forEach((b) => b.classList.remove("active"));
          e.currentTarget.classList.add("active");
          sfx("click");
        },
      })
    )
  );
  const rollBtn = h("button", { class: "btn primary", type: "button", text: "LEMPAR DADU" });
  game.wrap.append(dice, totalEl, row, betUi.row, rollBtn, resetBtn(() => game.setCredits(100)));

  let busy = false;
  const timers = [];
  function roll() {
    if (busy) return;
    if (!game.take(bet.value)) return;
    busy = true;
    rollBtn.disabled = true;
    game.say("Dadu bergulir...");
    let n = 0;
    const anim = setInterval(() => {
      diceEls.forEach((el) => (el.textContent = faces[randInt(0, 5)]));
      totalEl.textContent = "?";
      n++;
      if (n > 10) {
        clearInterval(anim);
        finish();
      }
    }, 70);
    timers.push(anim);
    function finish() {
      const a = randInt(1, 6);
      const b = randInt(1, 6);
      const sum = a + b;
      diceEls[0].textContent = faces[a - 1];
      diceEls[1].textContent = faces[b - 1];
      totalEl.textContent = String(sum);
      const o = opts.find((x) => x.id === picked.id);
      let winFlag = false;
      if (picked.id === "over") winFlag = sum >= 8;
      else if (picked.id === "under") winFlag = sum <= 6;
      else winFlag = sum === 7;
      if (winFlag) {
        const win = bet.value * o.mult;
        game.add(win);
        game.say(`Menang! Total ${sum} (+${win})`, "win");
        sfx("win");
      } else {
        game.say(`Kalah. Total ${sum}.`, "lose");
        sfx("over");
      }
      busy = false;
      rollBtn.disabled = false;
    }
  }
  rollBtn.addEventListener("click", roll);
  return {
    destroy() {
      timers.forEach((t) => clearInterval(t));
      game.scr.destroy();
    },
  };
}

/* -------------------------------- PLINKO --------------------------------- */
export function createPlinko(ctx, cfg = {}) {
  const st = createStage(ctx.root, {
    w: 320,
    h: 400,
    title: cfg.title,
    subtitle: cfg.subtitle,
    best: ctx.best,
    onBest: ctx.report,
  });
  const g = st.ctx;
  const W = st.w;
  const H = st.h;
  const rows = 8;
  const pegs = [];
  const top = 76;
  const bottom = H - 54;
  const mults = cfg.mults || [10, 4, 2, 0.5, 0.2, 0.5, 2, 4, 10];
  const buckets = mults.length;
  for (let r = 0; r < rows; r++) {
    const count = r + 3;
    const gapX = W / (count + 1);
    for (let c = 0; c < count; c++) {
      pegs.push({ x: gapX * (c + 1), y: top + (r * (bottom - top - 30)) / rows, r: 4 });
    }
  }
  const bucketW = W / buckets;
  const bet = 10;
  let credits = cfg.credits ?? 100;
  let balls = [];
  let parts = [];
  let msg = "Ketuk untuk jatuhkan bola";
  let t = 0;
  let over = false;

  function drop() {
    if (over) return;
    if (credits < bet) {
      msg = "Kredit habis — tap untuk mulai ulang";
      return;
    }
    credits -= bet;
    st.setScore(credits);
    balls.push({ x: W / 2 + rand(-3, 3), y: top - 22, vx: rand(-10, 10), vy: 0, r: 5.5, trail: [] });
    sfx("drop");
  }

  st.onTap(drop);

  function update(dt) {
    t += dt;
    for (const b of balls) {
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 7) b.trail.shift();
      b.vy += 720 * dt;
      b.vx *= 0.995;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      for (const p of pegs) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const d = Math.hypot(dx, dy);
        const min = b.r + p.r;
        if (d < min && d > 0.01) {
          const nx = dx / d;
          const ny = dy / d;
          b.x = p.x + nx * min;
          b.y = p.y + ny * min;
          const vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            b.vx -= 1.7 * vn * nx;
            b.vy -= 1.7 * vn * ny;
          }
          b.vx += rand(-36, 36);
          b.vy = Math.max(b.vy, 60);
        }
      }
      if (b.x < b.r + 2) {
        b.x = b.r + 2;
        b.vx = Math.abs(b.vx) * 0.6;
      }
      if (b.x > W - b.r - 2) {
        b.x = W - b.r - 2;
        b.vx = -Math.abs(b.vx) * 0.6;
      }
      if (b.y > bottom - 4) {
        b.dead = true;
        let idx = Math.floor(b.x / bucketW);
        idx = clamp(idx, 0, buckets - 1);
        const mult = mults[idx];
        const win = Math.round(bet * mult);
        credits += win;
        st.setScore(credits);
        msg = mult >= 1 ? `×${mult} → +${win}` : `×${mult} → +${win}`;
        if (mult >= 1) sfx("win");
        else sfx("tick");
        for (let i = 0; i < 14; i++) {
          parts.push({ x: b.x, y: bottom, vx: rand(-80, 80), vy: rand(-160, -20), life: rand(0.3, 0.7), max: 0.7, color: mult >= 1 ? "#a3e635" : "#fb7185" });
        }
        if (credits < bet) {
          over = true;
          st.end({
            score: credits,
            title: "Kredit habis",
            sub: `Sisa ${credits} kredit`,
            retry: () => {
              credits = 100;
              over = false;
              balls = [];
              parts = [];
              msg = "Ketuk untuk jatuhkan bola";
              st.hideOverlay();
              st.setScore(credits);
            },
          });
        }
      }
    }
    balls = balls.filter((b) => !b.dead);
    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt;
      p.life -= dt;
    }
    parts = parts.filter((p) => p.life > 0);
  }

  function render() {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#120a24");
    grad.addColorStop(1, "#241040");
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    for (const p of pegs) {
      g.fillStyle = "rgba(167,139,250,0.8)";
      g.shadowBlur = 6;
      g.shadowColor = "#a78bfa";
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
    }
    g.shadowBlur = 0;

    // bucket
    for (let i = 0; i < buckets; i++) {
      const x = i * bucketW;
      const m = mults[i];
      g.fillStyle = m >= 4 ? "rgba(251,191,36,0.85)" : m >= 1 ? "rgba(163,230,53,0.8)" : "rgba(251,113,133,0.8)";
      roundRect(g, x + 2, bottom, bucketW - 4, 30, 5);
      g.fill();
      g.fillStyle = "#0b0f1c";
      g.font = "700 10px ui-monospace, monospace";
      g.textAlign = "center";
      g.fillText(`×${m}`, x + bucketW / 2, bottom + 19);
    }

    // bola
    for (const b of balls) {
      for (let i = 0; i < b.trail.length; i++) {
        g.globalAlpha = (i / b.trail.length) * 0.3;
        g.fillStyle = "#4ee1ff";
        g.beginPath();
        g.arc(b.trail[i].x, b.trail[i].y, b.r, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      g.fillStyle = "#e7fbff";
      g.shadowBlur = 10;
      g.shadowColor = "#4ee1ff";
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
    }

    for (const p of parts) {
      g.globalAlpha = clamp(p.life / p.max, 0, 1);
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(p.x, p.y, 2, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    g.fillStyle = "#e7ecf7";
    g.font = "700 11px ui-monospace, monospace";
    g.textAlign = "left";
    g.fillText(`KREDIT ${credits}`, 10, 20);
    g.textAlign = "right";
    g.fillText(`TARUHAN ${bet}`, W - 10, 20);
    g.textAlign = "center";
    g.fillStyle = "rgba(231,236,247,0.7)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText(msg, W / 2, H - 10);
  }

  st.loop((dt) => {
    update(dt);
    render();
  });
  return { destroy: st.destroy };
}

/* -------------------------------- WHEEL ---------------------------------- */
export function createWheel(ctx, cfg = {}) {
  const st = createStage(ctx.root, {
    w: 320,
    h: 400,
    title: cfg.title,
    subtitle: cfg.subtitle,
    best: ctx.best,
    onBest: ctx.report,
  });
  const g = st.ctx;
  const W = st.w;
  const H = st.h;
  const segs = cfg.segs || [
    { label: "×0", mult: 0, color: "#334155" },
    { label: "×2", mult: 2, color: "#0e7490" },
    { label: "×0", mult: 0, color: "#334155" },
    { label: "×5", mult: 5, color: "#7c3aed" },
    { label: "×0", mult: 0, color: "#334155" },
    { label: "×10", mult: 10, color: "#b45309" },
    { label: "×2", mult: 2, color: "#0e7490" },
    { label: "×3", mult: 3, color: "#15803d" },
  ];
  const bet = cfg.bet ?? 10;
  let credits = cfg.credits ?? 100;
  let angle = 0;
  let spinning = false;
  let spinT = 0;
  let fromA = 0;
  let toA = 0;
  let duration = 0;
  let winSeg = -1;
  let msg = "Tekan roda untuk memutar";
  let over = false;
  let t = 0;

  const CX = W / 2;
  const CY = 196;
  const R = 118;
  const seg = (Math.PI * 2) / segs.length;

  function startSpin() {
    if (spinning || over) return;
    if (credits < bet) {
      msg = "Kredit habis";
      return;
    }
    credits -= bet;
    st.setScore(credits);
    winSeg = randInt(0, segs.length - 1);
    const target = Math.PI * 2 * 5 - (winSeg + 0.5) * seg;
    fromA = angle % (Math.PI * 2);
    toA = target;
    spinT = 0;
    duration = 4;
    spinning = true;
    msg = "Berputar...";
    sfx("drop");
  }

  st.onTap(startSpin);

  function update(dt) {
    t += dt;
    if (spinning) {
      spinT += dt;
      const p = clamp(spinT / duration, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      angle = fromA + (toA - fromA) * e;
      if (p >= 1) {
        spinning = false;
        const s = segs[winSeg];
        const win = Math.round(bet * s.mult);
        credits += win;
        st.setScore(credits);
        msg = s.mult > 0 ? `Dapat ${s.label}! +${win}` : "Zonk... coba lagi";
        sfx(s.mult > 0 ? "win" : "over");
        if (credits < bet) {
          over = true;
          st.end({
            score: credits,
            title: "Kredit habis",
            sub: `Sisa ${credits}`,
            retry: () => {
              credits = 100;
              over = false;
              spinning = false;
              msg = "Tekan roda untuk memutar";
              st.hideOverlay();
              st.setScore(credits);
            },
          });
        }
      }
    }
  }

  function render() {
    g.fillStyle = "#0a0618";
    g.fillRect(0, 0, W, H);

    g.save();
    g.translate(CX, CY);
    g.rotate(angle);
    for (let i = 0; i < segs.length; i++) {
      const a0 = i * seg - Math.PI / 2;
      const a1 = a0 + seg;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, R, a0, a1);
      g.closePath();
      g.fillStyle = segs[i].color;
      g.fill();
      g.strokeStyle = "rgba(0,0,0,0.35)";
      g.lineWidth = 1.5;
      g.stroke();
      g.save();
      g.rotate(a0 + seg / 2);
      g.fillStyle = "#f8fafc";
      g.font = "700 16px ui-monospace, monospace";
      g.textAlign = "right";
      g.fillText(segs[i].label, R - 14, 5);
      g.restore();
    }
    g.beginPath();
    g.arc(0, 0, 22, 0, Math.PI * 2);
    g.fillStyle = "#0b0f1c";
    g.fill();
    g.strokeStyle = "#4ee1ff";
    g.lineWidth = 3;
    g.stroke();
    g.restore();

    // penunjuk
    g.fillStyle = "#fbbf24";
    g.beginPath();
    g.moveTo(CX - 10, CY - R - 14);
    g.lineTo(CX + 10, CY - R - 14);
    g.lineTo(CX, CY - R + 8);
    g.closePath();
    g.fill();

    g.fillStyle = "#e7ecf7";
    g.font = "700 11px ui-monospace, monospace";
    g.textAlign = "left";
    g.fillText(`KREDIT ${credits}`, 10, 20);
    g.textAlign = "right";
    g.fillText(`TARUHAN ${bet}`, W - 10, 20);
    g.textAlign = "center";
    g.fillStyle = "rgba(231,236,247,0.75)";
    g.font = "600 11px ui-monospace, monospace";
    g.fillText(msg, W / 2, H - 18);
  }

  st.loop((dt) => {
    update(dt);
    render();
  });
  return { destroy: st.destroy };
}

/* -------------------------------- KOIN ---------------------------------- */
export function createCoin(ctx, cfg = {}) {
  const game = shell(ctx, cfg);
  const bet = { value: 10 };
  const coinEl = h("div", { class: "coin-face", text: "H" });
  const coinBox = h("div", { class: "coin-box" }, [coinEl]);
  const picked = { id: "heads" };
  const row = h("div", { class: "chip-row" }, [
    h("button", {
      class: "casino-choice active",
      type: "button",
      text: "KEPALA",
      onclick: (e) => {
        picked.id = "heads";
        row.querySelectorAll(".casino-choice").forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        sfx("click");
      },
    }),
    h("button", {
      class: "casino-choice",
      type: "button",
      text: "EKOR",
      onclick: (e) => {
        picked.id = "tails";
        row.querySelectorAll(".casino-choice").forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        sfx("click");
      },
    }),
  ]);
  const flipBtn = h("button", { class: "btn primary", type: "button", text: "LEMPAR KOIN" });
  const betUi = betRow(bet);
  game.wrap.append(coinBox, row, betUi.row, flipBtn, resetBtn(() => game.setCredits(100)));

  let busy = false;
  const timers = [];
  function flip() {
    if (busy) return;
    if (!game.take(bet.value)) return;
    busy = true;
    flipBtn.disabled = true;
    game.say("Koin berputar...");
    coinBox.classList.add("flipping");
    let n = 0;
    const anim = setInterval(() => {
      coinEl.textContent = Math.random() < 0.5 ? "H" : "T";
      n++;
      if (n > 8) {
        clearInterval(anim);
        finish();
      }
    }, 70);
    timers.push(anim);
    function finish() {
      const heads = Math.random() < 0.5;
      coinEl.textContent = heads ? "H" : "T";
      coinBox.classList.remove("flipping");
      const win = (heads && picked.id === "heads") || (!heads && picked.id === "tails");
      if (win) {
        game.add(bet.value * 2);
        game.say(`Menang! ${heads ? "KEPALA" : "EKOR"} (+${bet.value})`, "win");
        sfx("win");
      } else {
        game.say(`Kalah. Keluar ${heads ? "KEPALA" : "EKOR"}.`, "lose");
        sfx("over");
      }
      busy = false;
      flipBtn.disabled = false;
    }
  }
  flipBtn.addEventListener("click", flip);
  return {
    destroy() {
      timers.forEach((t) => clearInterval(t));
      game.scr.destroy();
    },
  };
}

/* -------------------------------- KENO ---------------------------------- */
export function createKeno(ctx, cfg = {}) {
  const game = shell(ctx, cfg);
  const bet = { value: 10 };
  const picks = new Set();
  const draw = new Set();
  const grid = h("div", { class: "num-grid" });
  const cells = [];
  for (let i = 1; i <= 20; i++) {
    const b = h("button", { class: "num-cell", type: "button", text: String(i) });
    b.addEventListener("click", () => {
      if (draw.size) return;
      if (picks.has(i)) picks.delete(i);
      else if (picks.size < 5) picks.add(i);
      else return;
      b.classList.toggle("sel", picks.has(i));
      sfx("click");
    });
    cells.push(b);
    grid.append(b);
  }
  const playBtn = h("button", { class: "btn primary", type: "button", text: "UNDI" });
  const betUi = betRow(bet);
  game.wrap.append(h("p", { class: "casino-note", text: "Pilih 5 nomor, lalu undi 5 bola." }), grid, betUi.row, playBtn, resetBtn(() => game.setCredits(100)));

  const pays = [0, 0, 1, 3, 9, 40];
  let busy = false;
  const timers = [];

  function play() {
    if (busy || picks.size !== 5) {
      if (picks.size !== 5) game.say("Pilih tepat 5 nomor dulu.", "lose");
      return;
    }
    if (!game.take(bet.value)) return;
    busy = true;
    playBtn.disabled = true;
    draw.clear();
    cells.forEach((c) => {
      c.classList.remove("hit", "miss");
    });
    game.say("Mengundi...");
    const pool = [];
    for (let i = 1; i <= 20; i++) pool.push(i);
    for (let k = 0; k < 5; k++) {
      const idx = randInt(0, pool.length - 1);
      draw.add(pool[idx]);
      pool.splice(idx, 1);
    }
    let step = 0;
    const anim = setInterval(() => {
      if (step >= 5) {
        clearInterval(anim);
        settle();
        return;
      }
      const n = [...draw][step];
      const cell = cells[n - 1];
      cell.classList.add(picks.has(n) ? "hit" : "miss");
      sfx("tick");
      step++;
    }, 260);
    timers.push(anim);

    function settle() {
      let matches = 0;
      for (const n of draw) if (picks.has(n)) matches++;
      const mult = pays[matches] || 0;
      const win = bet.value * mult;
      if (win > 0) {
        game.add(win);
        game.say(`${matches} cocok! +${win}`, "win");
        sfx("win");
      } else {
        game.say(`${matches} cocok. Belum beruntung.`, "lose");
        sfx("over");
      }
      busy = false;
      playBtn.disabled = false;
      draw.clear();
    }
  }
  playBtn.addEventListener("click", play);
  return {
    destroy() {
      timers.forEach((t) => clearInterval(t));
      game.scr.destroy();
    },
  };
}

/* ------------------------------- SCRATCH --------------------------------- */
export function createScratch(ctx, cfg = {}) {
  const game = shell(ctx, cfg);
  const symbols = ["🍒", "🔔", "⭐", "💎", "🍀"];
  const cost = 10;
  const grid = h("div", { class: "scratch-grid" });
  const cells = [];
  let gridData = [];
  let revealed = 0;
  let busy = false;

  function newCard() {
    gridData = [];
    revealed = 0;
    busy = false;
    grid.innerHTML = "";
    cells.length = 0;
    for (let i = 0; i < 9; i++) {
      const sym = pick(symbols);
      gridData.push(sym);
      const b = h("button", { class: "scratch-cell", type: "button", text: "?" });
      b.addEventListener("click", () => {
        if (busy || b.classList.contains("open")) return;
        b.classList.add("open");
        b.textContent = sym;
        revealed++;
        sfx("flip");
        if (revealed === 9) settle();
      });
      cells.push(b);
      grid.append(b);
    }
  }

  function checkLines(data) {
    const lines = [];
    for (let r = 0; r < 3; r++) lines.push([r * 3, r * 3 + 1, r * 3 + 2]);
    for (let c = 0; c < 3; c++) lines.push([c, c + 3, c + 6]);
    lines.push([0, 4, 8], [2, 4, 6]);
    let count = 0;
    for (const ln of lines) {
      if (data[ln[0]] === data[ln[1]] && data[ln[1]] === data[ln[2]]) count++;
    }
    return count;
  }

  function settle() {
    busy = true;
    const lines = checkLines(gridData);
    const mult = lines >= 3 ? 25 : lines >= 1 ? 8 : 0;
    const win = cost * mult;
    if (win > 0) {
      game.add(win);
      game.say(`${lines} garis! +${win}`, "win");
      sfx("win");
    } else {
      game.say("Belum ada garis. Coba kartu baru.", "lose");
      sfx("over");
    }
  }

  const buyBtn = h("button", {
    class: "btn primary",
    type: "button",
    text: `BELI KARTU (${cost})`,
    onclick: () => {
      if (busy) return;
      if (!game.take(cost)) return;
      newCard();
      game.say("Gosok 9 kotak untuk membuka.");
      sfx("click");
    },
  });
  game.wrap.append(h("p", { class: "casino-note", text: "Sama 3 sebaris = 8x · 3 garis = 25x" }), grid, buyBtn, resetBtn(() => game.setCredits(100)));
  newCard();
  cells.forEach((c) => (c.textContent = "?"));
  return { destroy: () => game.scr.destroy() };
}

/* -------------------------------- BINGO ---------------------------------- */
export function createBingo(ctx, cfg = {}) {
  const game = shell(ctx, cfg);
  const cost = 10;
  const grid = h("div", { class: "bingo-grid" });
  let card = [];
  let marked = new Set();
  let drawn = [];
  let busy = false;
  let cells = [];

  function makeCard() {
    const cols = [0, 1, 2, 3, 4].map((c) => {
      const pool = [];
      for (let n = c * 15 + 1; n <= c * 15 + 15; n++) pool.push(n);
      return [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    });
    card = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) card.push(cols[c][r]);
    card[12] = 0;
    marked = new Set([12]);
    drawn = [];
    busy = false;
    grid.innerHTML = "";
    cells = card.map((n, i) =>
      h("div", { class: "bingo-cell" + (i === 12 ? " free marked" : ""), text: i === 12 ? "★" : String(n) })
    );
    cells.forEach((c) => grid.append(c));
    game.wrap.querySelector(".casino-bingo-msg2")?.remove();
    game.say("Beli kartu, lalu undi nomor.");
  }

  function hasLine() {
    const lines = [];
    for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
    for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
    lines.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
    return lines.some((ln) => ln.every((i) => marked.has(i)));
  }

  function drawBall() {
    if (!drawn.length) {
      if (!game.take(cost)) return;
      makeCard();
    }
    const pool = [];
    for (let n = 1; n <= 75; n++) if (!drawn.includes(n)) pool.push(n);
    if (!pool.length) return;
    const n = pick(pool);
    drawn.push(n);
    const idx = card.indexOf(n);
    if (idx >= 0 && !marked.has(idx)) {
      marked.add(idx);
      cells[idx].classList.add("marked");
    }
    sfx("tick");
    if (hasLine()) {
      const win = cost * 10;
      game.add(win);
      game.say(`BINGO! +${win}`, "win");
      sfx("win");
      drawn = [];
      busy = false;
      return;
    }
    game.say(`Bola ${n} · ${drawn.length} nomor terundi`);
    if (drawn.length >= 40) {
      game.say("Kartu habis tanpa bingo. Coba lagi.", "lose");
      drawn = [];
    }
  }

  const drawBtn = h("button", { class: "btn primary", type: "button", text: "UNDI BOLA", onclick: drawBall });
  game.wrap.append(
    h("p", { class: "casino-note", text: "Kartu 10 kredit · satu garis = 10x" }),
    grid,
    drawBtn,
    h("button", { class: "btn ghost tiny", type: "button", text: "Kartu baru", onclick: () => { drawn = []; makeCard(); sfx("click"); } }),
    resetBtn(() => game.setCredits(100))
  );
  makeCard();
  return { destroy: () => game.scr.destroy() };
}
