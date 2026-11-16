// Pack refleks: latihan aim, gelembung, UFO, tikus, tangkap buah, dan mini game timing.
import { createStage, clamp, rand, randInt, pick, sfx, roundRect } from "../lib/kit.js";
import { createAimGame } from "../lib/engines/aim.js";

const aim = (id, name, emoji, desc, cfg) => ({
  id,
  name,
  emoji,
  tag: "Reflex",
  desc,
  bestMode: "max",
  mount: (ctx) =>
    createAimGame(ctx, {
      title: `${emoji} ${name}`,
      subtitle: desc,
      ...cfg,
    }),
});

/* ------------------------------ PRECISION BAR ----------------------------- */
function precisionBar(ctx) {
  const st = createStage(ctx.root, {
    title: "🎯 Precision Bar",
    subtitle: "Hentikan penanda di zona tengah",
    best: ctx.best,
    onBest: ctx.report,
  });
  const g = st.ctx, W = st.w, H = st.h;
  let pos, dir, speed, zoneHalf, round, score, over, last, markT;

  function reset() {
    pos = 40;
    dir = 1;
    speed = 150;
    zoneHalf = 38;
    round = 0;
    score = 0;
    over = false;
    last = 0;
    markT = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap(() => {
    if (over) return;
    const d = Math.abs(pos - W / 2);
    let pts = 0;
    if (d <= zoneHalf) pts = Math.round(100 - (d / zoneHalf) * 55);
    score += pts;
    last = pts;
    markT = 0.8;
    round++;
    sfx(pts > 0 ? "point" : "tick");
    st.setScore(score);
    if (round >= 10) {
      over = true;
      st.end({
        score,
        title: "Selesai!",
        sub: `10 percobaan · ${score} poin`,
        retry: reset,
      });
      return;
    }
    zoneHalf = Math.max(10, 38 - round * 2.6);
    speed += 22;
    pos = 40;
    dir = 1;
  });

  st.loop((dt) => {
    if (!over) {
      pos += dir * speed * dt;
      if (pos > W - 40) {
        pos = W - 40;
        dir = -1;
      }
      if (pos < 40) {
        pos = 40;
        dir = 1;
      }
      markT = Math.max(0, markT - dt);
    }
    g.fillStyle = "#0b1220";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 24; i++) {
      const x = ((i * 61 + pos * 0.1) % (W + 20)) - 10;
      g.fillRect(x, (i * 37) % H, 2, 2);
    }
    // bar
    g.fillStyle = "#1d2a44";
    roundRect(g, 34, H / 2 - 10, W - 68, 20, 10);
    g.fill();
    // zona
    g.fillStyle = "rgba(78,225,255,0.35)";
    roundRect(g, W / 2 - zoneHalf, H / 2 - 26, zoneHalf * 2, 52, 12);
    g.fill();
    g.fillStyle = "rgba(78,225,255,0.9)";
    roundRect(g, W / 2 - 1, H / 2 - 30, 2, 60, 1);
    g.fill();
    // marker
    g.fillStyle = "#ffd166";
    roundRect(g, pos - 3, H / 2 - 34, 6, 68, 3);
    g.fill();
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 13px ui-monospace, monospace";
    g.fillText(`Ronde ${Math.min(10, round + 1)}/10`, W / 2, H / 2 - 66);
    g.fillText(`SKOR ${score}`, W / 2, H / 2 + 78);
    if (markT > 0) {
      g.fillStyle = last > 0 ? "#a3e635" : "#fb7185";
      g.font = "800 22px ui-monospace, monospace";
      g.fillText(last > 0 ? `+${last}` : "MISS", W / 2, H / 2 - 100);
    }
    g.fillStyle = "rgba(231,236,247,0.65)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("ketuk saat penanda di zona", W / 2, H - 18);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* -------------------------------- QUICK DRAW ------------------------------ */
function quickDraw(ctx) {
  const st = createStage(ctx.root, {
    title: "⚡ Quick Draw",
    subtitle: "Tunggu hijau, lalu tap secepat mungkin",
    best: ctx.best,
    onBest: ctx.report,
  });
  const g = st.ctx, W = st.w, H = st.h;
  let state, deadline, goAt, round, score, lastMs, over, flash;

  function reset() {
    state = "wait";
    deadline = performance.now() + rand(1400, 3200);
    goAt = 0;
    round = 0;
    score = 0;
    lastMs = 0;
    over = false;
    flash = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  function nextWait() {
    state = "wait";
    deadline = performance.now() + rand(1100, 2800);
  }

  st.onTap(() => {
    if (over) return;
    if (state === "wait") {
      score = Math.max(0, score - 40);
      st.setScore(score);
      flash = 0.4;
      sfx("over");
      nextWait();
      return;
    }
    if (state !== "go") return;
    const ms = Math.round(performance.now() - goAt);
    lastMs = ms;
    const pts = Math.max(0, 700 - ms);
    score += pts;
    round++;
    st.setScore(score);
    sfx(ms < 320 ? "win" : "point");
    if (round >= 5) {
      over = true;
      state = "done";
      st.end({ score, title: "Refleks terukur!", sub: `Terakhir ${ms} ms · total ${score}`, retry: reset });
      return;
    }
    nextWait();
  });

  st.loop((dt) => {
    if (!over && state === "wait" && performance.now() >= deadline) {
      state = "go";
      goAt = performance.now();
      sfx("tick");
    }
    flash = Math.max(0, flash - dt);
    const go = state === "go";
    g.fillStyle = go ? "#123b23" : "#3a1220";
    g.fillRect(0, 0, W, H);
    if (flash > 0) {
      g.fillStyle = `rgba(251,113,133,${flash})`;
      g.fillRect(0, 0, W, H);
    }
    g.textAlign = "center";
    g.fillStyle = go ? "#6ee7a8" : "#ff9db1";
    g.font = "800 34px ui-monospace, monospace";
    g.fillText(go ? "TAP!" : "TUNGGU", W / 2, H / 2 - 6);
    g.fillStyle = "rgba(231,236,247,0.8)";
    g.font = "700 14px ui-monospace, monospace";
    g.fillText(go ? "sekarang!" : "jangan menyerah dulu", W / 2, H / 2 + 30);
    g.font = "700 13px ui-monospace, monospace";
    g.fillText(`Ronde ${Math.min(5, round + 1)}/5`, W / 2, 40);
    g.fillText(`SKOR ${score}`, W / 2, 62);
    if (lastMs) g.fillText(`terakhir ${lastMs} ms`, W / 2, H - 28);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* --------------------------------- BEAT TAP ------------------------------- */
function beatTap(ctx) {
  const st = createStage(ctx.root, {
    title: "🥁 Beat Tap",
    subtitle: "Ketuk saat cincin masuk lingkaran",
    best: ctx.best,
    onBest: ctx.report,
  });
  const g = st.ctx, W = st.w, H = st.h;
  const TARGET = 42;
  let notes, elapsed, spawnT, spawned, score, combo, bestCombo, over, pop;

  function reset() {
    notes = [];
    elapsed = 0;
    spawnT = 0.3;
    spawned = 0;
    score = 0;
    combo = 0;
    bestCombo = 0;
    over = false;
    pop = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap(() => {
    if (over) return;
    let best = null, bestD = 1e9;
    const cy = H / 2;
    for (const n of notes) {
      if (n.hit) continue;
      const r = 128 - (elapsed - n.born) * 74;
      if (r < 8) continue;
      const d = Math.abs(r - TARGET);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    if (!best || bestD > 26) {
      combo = 0;
      score = Math.max(0, score - 8);
      sfx("tick");
      st.setScore(score);
      return;
    }
    best.hit = true;
    bestCombo = Math.max(bestCombo, ++combo);
    const pts = bestD < 7 ? 100 : bestD < 15 ? 60 : 30;
    score += pts;
    pop = 0.25;
    sfx(bestD < 7 ? "win" : "point");
    st.setScore(score);
  });

  st.loop((dt) => {
    if (!over) {
      elapsed += dt;
      spawnT -= dt;
      if (spawnT <= 0 && spawned < 30) {
        notes.push({ born: elapsed, hit: false });
        spawned++;
        spawnT = 0.72;
      }
      notes = notes.filter((n) => !n.hit && 128 - (elapsed - n.born) * 74 > 4);
      if (spawned >= 30 && !notes.length) {
        over = true;
        const bonus = bestCombo * 10;
        st.end({ score: score + bonus, title: "Lagu selesai!", sub: `Combo terbaik x${bestCombo} · bonus ${bonus}`, retry: reset });
      }
      pop = Math.max(0, pop - dt);
    }
    g.fillStyle = "#0a0f1c";
    g.fillRect(0, 0, W, H);
    const cy = H / 2;
    // lane lines
    g.strokeStyle = "rgba(120,150,220,0.18)";
    g.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      g.beginPath();
      g.moveTo((W / 4) * i, 50);
      g.lineTo((W / 4) * i, H - 40);
      g.stroke();
    }
    // target ring
    g.strokeStyle = "#4ee1ff";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(W / 2, cy, TARGET, 0, Math.PI * 2);
    g.stroke();
    if (pop > 0) {
      g.strokeStyle = `rgba(163,230,53,${pop * 3})`;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(W / 2, cy, TARGET + (0.25 - pop) * 120, 0, Math.PI * 2);
      g.stroke();
    }
    // notes
    for (const n of notes) {
      const r = 128 - (elapsed - n.born) * 74;
      if (r < 6) continue;
      const alpha = clamp(r / 128, 0.15, 1);
      g.strokeStyle = `rgba(167,139,250,${alpha})`;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(W / 2, cy, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.textAlign = "center";
    g.fillStyle = "#e7ecf7";
    g.font = "700 13px ui-monospace, monospace";
    g.fillText(`SKOR ${score}`, W / 2, 30);
    g.fillText(`COMBO x${combo}`, W / 2, 50);
    g.fillStyle = "rgba(231,236,247,0.65)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("ketuk saat cincin menyentuh lingkaran", W / 2, H - 16);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* ------------------------------- BALANCE BALL ----------------------------- */
function balanceBall(ctx) {
  const st = createStage(ctx.root, {
    title: "⚖️ Balance Ball",
    subtitle: "Jaga bola di papan, makin lama makin sempit",
    best: ctx.best,
    onBest: ctx.report,
  });
  const g = st.ctx, W = st.w, H = st.h;
  let bx, bv, elapsed, tilt, half, over, fallY, alive;

  function reset() {
    bx = W / 2;
    bv = 0;
    elapsed = 0;
    tilt = 0;
    half = 96;
    over = false;
    fallY = 0;
    alive = true;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onPointer((p) => {
    if (over) return;
    if (p.inside) tilt = clamp((p.x - W / 2) / (W / 2), -1, 1);
  });

  st.loop((dt) => {
    if (!over) {
      const kb = (st.isDown("right", "d") ? 1 : 0) - (st.isDown("left", "a") ? 1 : 0);
      if (kb) tilt = kb;
      else if (!st.pointer.inside || !st.pointer.down) tilt *= 0.995;
      bv += tilt * 210 * dt;
      bv *= 0.995;
      bx += bv * dt;
      elapsed += dt;
      half = Math.max(30, 96 - elapsed * 1.15);
      if (Math.abs(bx - W / 2) > half) {
        over = true;
        alive = false;
        sfx("over");
        setTimeout(
          () =>
            st.end({
              score: Math.floor(elapsed * 10),
              title: "Bola jatuh!",
              sub: `Bertahan ${elapsed.toFixed(1)} detik`,
              retry: reset,
            }),
          500
        );
      }
      st.setScore(Math.floor(elapsed * 10));
    } else {
      fallY += 160 * dt;
    }
    g.fillStyle = "#0c1626";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 20; i++) {
      const y = ((i * 43 + elapsed * 12) % (H + 20)) - 10;
      g.fillRect(18 + (i % 4) * 76, y, 2, 2);
    }
    const py = 240;
    const ang = tilt * 0.22;
    g.save();
    g.translate(W / 2, py);
    g.rotate(ang);
    g.fillStyle = "#2b3c5e";
    roundRect(g, -half, -8, half * 2, 16, 8);
    g.fill();
    g.fillStyle = "#4ee1ff";
    roundRect(g, -half, -8, half * 2, 3, 2);
    g.fill();
    g.restore();
    const by = alive ? py - 15 : py - 15 + fallY;
    if (alive || fallY < 260) {
      g.fillStyle = "#ffd166";
      g.beginPath();
      g.arc(bx, by, 12, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.7)";
      g.beginPath();
      g.arc(bx - 4, by - 4, 3, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 14px ui-monospace, monospace";
    g.fillText(`${elapsed.toFixed(1)}s`, W / 2, 34);
    g.font = "600 10px ui-monospace, monospace";
    g.fillStyle = "rgba(231,236,247,0.65)";
    g.fillText("geser / panah kiri-kanan untuk miringkan papan", W / 2, H - 16);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

export const reflex = [
  aim("aim-trainer", "Aim Trainer", "🎯", "Latih presisi menembak target bergerak.", {
    theme: "night",
    target: "bullseye",
    duration: 30,
    spawnMin: 0.35,
    spawnMax: 0.7,
    ttl: 1.8,
    moving: true,
    radius: 19,
    speed: 1,
  }),
  aim("bubble-pop", "Bubble Pop", "🫧", "Pecahkan gelembung sebelum lepas.", {
    theme: "candy",
    target: "bubble",
    duration: 30,
    spawnMin: 0.32,
    spawnMax: 0.6,
    ttl: 2.4,
    radius: 22,
    speed: 1.15,
  }),
  aim("tap-frenzy", "Tap Frenzy", "👆", "Target muncul cepat, jangan kalah cepat.", {
    theme: "doom",
    target: "bullseye",
    duration: 25,
    spawnMin: 0.22,
    spawnMax: 0.42,
    ttl: 1.05,
    radius: 18,
    speed: 1.2,
  }),
  aim("ufo-hunt", "UFO Hunt", "🛸", "Tembak UFO yang melintas di angkasa.", {
    theme: "space",
    target: "ufo",
    duration: 30,
    spawnMin: 0.45,
    spawnMax: 0.8,
    ttl: 4,
    speed: 1.35,
    radius: 22,
  }),
  aim("mole-rush", "Mole Rush", "🐹", "Tikus muncul sebentar, pukul cepat.", {
    theme: "field",
    target: "mole",
    duration: 30,
    spawnMin: 0.3,
    spawnMax: 0.55,
    ttl: 1.05,
    radius: 24,
    speed: 1,
  }),
  aim("falling-catch", "Falling Catch", "🍎", "Tangkap buah yang jatuh sebelum hilang.", {
    theme: "sky",
    target: "fruit",
    duration: 30,
    spawnMin: 0.36,
    spawnMax: 0.62,
    ttl: 3,
    speed: 1.15,
    radius: 19,
  }),
  { id: "precision-bar", name: "Precision Bar", emoji: "📏", tag: "Reflex", desc: "Hentikan penanda tepat di zona tengah.", bestMode: "max", mount: precisionBar },
  { id: "quick-draw", name: "Quick Draw", emoji: "⚡", tag: "Reflex", desc: "Reaksi tercepat saat layar hijau.", bestMode: "max", mount: quickDraw },
  { id: "beat-tap", name: "Beat Tap", emoji: "🥁", tag: "Reflex", desc: "Ketuk cincin tepat di lingkarannya.", bestMode: "max", mount: beatTap },
  { id: "balance-ball", name: "Balance Ball", emoji: "⚖️", tag: "Reflex", desc: "Jaga bola tetap di papan yang menyempit.", bestMode: "max", mount: balanceBall },
];
