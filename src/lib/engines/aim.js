// Engine game sasaran: gelembung, UFO, tikus, buah jatuh, target, bom.
// Skor + akurasi, combo, dan waktu. Dipakai pack reflex.
import { createStage, clamp, rand, randInt, pick, sfx } from "../kit.js";

const BG = {
  night: ["#08101f", "#12203a"],
  candy: ["#2a0f2e", "#4a1740"],
  field: ["#10240f", "#1f4420"],
  space: ["#05060f", "#141a33"],
  sky: ["#0a3a63", "#2f8fc4"],
  doom: ["#1a0a0a", "#3a1212"],
};

function drawTarget(g, o, t) {
  g.save();
  g.translate(o.x, o.y);
  const r = o.r;
  if (o.type === "bubble") {
    g.fillStyle = o.color;
    g.globalAlpha = 0.28;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 0.95;
    g.strokeStyle = o.color;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.beginPath();
    g.arc(-r * 0.35, -r * 0.4, r * 0.22, 0, Math.PI * 2);
    g.fill();
  } else if (o.type === "ufo") {
    g.fillStyle = "rgba(120,230,255,0.35)";
    g.beginPath();
    g.ellipse(0, r * 0.5, r * 0.9, r * 0.9, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = o.color;
    g.beginPath();
    g.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#a5f3fc";
    g.beginPath();
    g.ellipse(0, -r * 0.22, r * 0.42, r * 0.36, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.8)";
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.arc(i * r * 0.5, r * 0.1, 1.8, 0, Math.PI * 2);
      g.fill();
    }
  } else if (o.type === "mole") {
    g.fillStyle = "#1a0f0a";
    g.beginPath();
    g.ellipse(0, r * 0.55, r * 1.1, r * 0.4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = o.decoy ? "#6b7280" : "#b07a4a";
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    if (o.decoy) {
      g.fillStyle = "#111827";
      g.beginPath();
      g.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#fb7185";
      g.font = `700 ${Math.floor(r * 0.8)}px ui-monospace, monospace`;
      g.textAlign = "center";
      g.fillText("!", 0, r * 0.28);
    } else {
      g.fillStyle = "#111827";
      g.beginPath();
      g.arc(-r * 0.32, -r * 0.2, r * 0.16, 0, Math.PI * 2);
      g.arc(r * 0.32, -r * 0.2, r * 0.16, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f9a8d4";
      g.beginPath();
      g.arc(0, r * 0.15, r * 0.18, 0, Math.PI * 2);
      g.fill();
    }
  } else if (o.type === "bullseye") {
    const cols = ["#ffffff", "#fb7185", "#ffffff", "#fb7185", "#ffd166"];
    for (let i = 4; i >= 0; i--) {
      g.fillStyle = cols[i];
      g.beginPath();
      g.arc(0, 0, (r * (i + 1)) / 5, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(0,0,0,0.25)";
    g.lineWidth = 1;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
  } else if (o.type === "fruit") {
    g.fillStyle = o.decoy ? "#374151" : o.color;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    if (o.decoy) {
      g.fillStyle = "#111827";
      g.beginPath();
      g.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#fbbf24";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(r * 0.2, -r * 0.8);
      g.quadraticCurveTo(r * 0.7, -r * 1.1, r * 0.5, -r * 1.4);
      g.stroke();
      g.fillStyle = "#fbbf24";
      g.beginPath();
      g.arc(r * 0.55, -r * 1.45, 2.4, 0, Math.PI * 2);
      g.fill();
    } else {
      g.fillStyle = "#22c55e";
      g.beginPath();
      g.ellipse(r * 0.3, -r * 0.95, r * 0.38, r * 0.16, -0.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.beginPath();
      g.arc(-r * 0.35, -r * 0.3, r * 0.25, 0, Math.PI * 2);
      g.fill();
    }
  } else if (o.type === "note") {
    g.fillStyle = o.decoy ? "#64748b" : o.color;
    g.beginPath();
    g.moveTo(-r * 0.3, -r);
    g.lineTo(r * 0.7, -r);
    g.lineTo(r * 0.7, r * 0.4);
    g.lineTo(r * 0.35, r * 0.4);
    g.lineTo(r * 0.35, -r * 0.55);
    g.lineTo(-r * 0.3, -r * 0.55);
    g.closePath();
    g.fill();
    g.beginPath();
    g.ellipse(-r * 0.5, r * 0.55, r * 0.42, r * 0.3, -0.35, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.3)";
    g.beginPath();
    g.ellipse(r * 0.5, r * 0.55, r * 0.42, r * 0.3, -0.35, 0, Math.PI * 2);
    g.fill();
  }
  // cincin umur
  if (o.life !== undefined) {
    g.strokeStyle = o.decoy ? "rgba(251,113,133,0.8)" : "rgba(255,255,255,0.5)";
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(0, 0, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(o.life / o.maxLife, 0, 1));
    g.stroke();
  }
  g.restore();
}

export function createAimGame(ctx, cfg = {}) {
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
  const theme = BG[cfg.theme] || BG.night;
  const tType = cfg.target || "bullseye";
  const duration = cfg.duration ?? 30;
  const spawnMin = cfg.spawnMin ?? 0.4;
  const spawnMax = cfg.spawnMax ?? 0.8;
  const ttl = cfg.ttl ?? 1.9;
  const decoy = !!cfg.decoy;
  const moving = !!cfg.moving;
  const shotsPenalty = cfg.shotsPenalty ?? 0;
  const targetColor = cfg.color || "#4ee1ff";
  const colors = ["#4ee1ff", "#a78bfa", "#ff6bd6", "#a3e635", "#fbbf24", "#fb7185"];

  let targets, parts, floats, score, time, spawnT, shots, hits, combo, bestCombo, over, t, radius, speed;

  function reset() {
    targets = [];
    parts = [];
    floats = [];
    score = 0;
    time = duration;
    spawnT = 0.4;
    shots = 0;
    hits = 0;
    combo = 0;
    bestCombo = 0;
    over = false;
    t = 0;
    radius = cfg.radius ?? 20;
    speed = cfg.speed ?? 1;
    st.hideOverlay();
    st.setScore(0);
  }

  function spawn() {
    const dec = decoy && Math.random() < (cfg.decoyChance ?? 0.22);
    const roll = Math.random();
    let o;
    if (tType === "bubble") {
      o = { x: rand(30, W - 30), y: H + 24, vy: -rand(52, 86) * speed, vx: rand(-18, 18), r: rand(13, 25), type: "bubble" };
    } else if (tType === "ufo") {
      const left = roll < 0.5;
      o = { x: left ? -26 : W + 26, y: rand(58, H - 70), vx: (left ? 1 : -1) * rand(42, 78) * speed, vy: rand(-8, 8), r: 22, type: "ufo" };
    } else if (tType === "mole") {
      const cell = randInt(0, 8);
      const cx = 62 + (cell % 3) * 98;
      const cy = 104 + Math.floor(cell / 3) * 92;
      o = { x: cx, y: cy, vx: 0, vy: 0, r: 24, type: "mole", life: ttl, maxLife: ttl };
    } else if (tType === "fruit") {
      o = { x: rand(28, W - 28), y: -26, vy: rand(62, 112) * speed, vx: rand(-16, 16), r: rand(14, 21), type: "fruit" };
    } else if (tType === "note") {
      o = { x: rand(34, W - 34), y: H + 24, vy: -rand(70, 112) * speed, vx: 0, r: 16, type: "note" };
    } else {
      o = { x: rand(34, W - 34), y: rand(58, H - 44), r: rand(15, 24), vx: moving ? rand(-30, 30) : 0, vy: moving ? rand(-24, 24) : 0, type: "bullseye", life: ttl, maxLife: ttl };
    }
    o.decoy = dec;
    o.color = dec ? "#6b7280" : pick(colors);
    o.maxLife = o.maxLife || ttl;
    if (o.type === "bubble" || o.type === "ufo" || o.type === "fruit" || o.type === "note") o.life = undefined;
    targets.push(o);
  }

  function addParts(x, y, c, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(30, 190);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.2, 0.55), max: 0.55, color: c, r: rand(1.2, 3) });
    }
  }

  st.onTap((p) => {
    if (over) return;
    shots++;
    let hit = null;
    for (let i = targets.length - 1; i >= 0; i--) {
      const o = targets[i];
      if (Math.hypot(p.x - o.x, p.y - o.y) <= o.r + 6) {
        hit = o;
        targets.splice(i, 1);
        break;
      }
    }
    if (!hit) {
      combo = 0;
      if (shotsPenalty) {
        score = Math.max(0, score - shotsPenalty);
        st.setScore(score);
      }
      st.ring(p.x, p.y, { color: "#64748b", r: 18, width: 1.4, life: 0.22 });
      sfx("tick");
      return;
    }
    if (hit.decoy) {
      combo = 0;
      score = Math.max(0, score - (cfg.decoyPenalty ?? 15));
      st.setScore(score);
      addParts(hit.x, hit.y, "#fb7185", 14);
      floats.push({ x: hit.x, y: hit.y, text: "−15", color: "#fb7185", life: 0.8 });
      st.burst(hit.x, hit.y, { n: 12, color: "#fb7185", speed: 180, size: 2.6 });
      st.shake(5, 150);
      sfx("hit");
      return;
    }
    hits++;
    combo++;
    bestCombo = Math.max(bestCombo, combo);
    const base = hit.type === "ufo" ? 15 : hit.type === "bullseye" ? 12 : 10;
    const bonus = hit.r < 19 ? 5 : 0;
    const gain = Math.round((base + bonus) * (1 + Math.min(combo, 10) * 0.08));
    score += gain;
    st.setScore(score);
    addParts(hit.x, hit.y, hit.color, 12);
    floats.push({ x: hit.x, y: hit.y, text: `+${gain}`, color: "#a3e635", life: 0.8 });
    st.burst(hit.x, hit.y, { n: 14, color: hit.color, speed: 210, size: 2.6, life: 0.5 });
    st.ring(hit.x, hit.y, { color: hit.color, r: hit.r + 16, width: 2, life: 0.3 });
    if (bonus) st.pop(hit.x, hit.y - hit.r - 4, "PERFECT", { color: "#ffd166", size: 9 });
    else if (combo >= 5) st.pop(hit.x, hit.y - hit.r - 4, `x${combo}`, { color: "#a3e635", size: 9 });
    if (combo > 0 && combo % 10 === 0) {
      st.flash("rgba(163,230,53,0.16)", 160);
      st.shake(4, 140);
      st.pop(hit.x, hit.y - 20, "ON FIRE!", { color: "#a3e635", size: 12 });
    }
    sfx("point");
  });

  function update(dt) {
    if (over) return;
    t += dt;
    time -= dt;
    if (time <= 0) {
      time = 0;
      over = true;
      const acc = shots ? Math.round((hits / shots) * 100) : 0;
      const bonus = Math.round(acc * 0.6);
      score += bonus;
      st.setScore(score);
      st.flash("rgba(255,220,120,0.25)", 260);
      st.end({
        score,
        title: "Waktu habis!",
        sub: `${hits}/${shots} tepat · akurasi ${acc}% · bonus ${bonus}`,
        retry: reset,
      });
      return;
    }
    spawnT -= dt;
    if (spawnT <= 0) {
      spawn();
      spawnT = rand(spawnMin, spawnMax) * (1 - Math.min(0.35, t / (duration * 3)));
    }

    for (const o of targets) {
      o.x += (o.vx || 0) * dt;
      o.y += (o.vy || 0) * dt;
      if (o.type === "bubble") o.vx = Math.sin((t + o.y) * 2) * 22;
      if (o.type === "mole" || o.type === "bullseye") {
        o.life -= dt;
        if (o.life <= 0) {
          o.dead = true;
          if (!o.decoy) combo = 0;
        }
      }
      if (o.y > H + 40 || o.y < -46 || o.x < -50 || o.x > W + 50) o.dead = true;
    }
    targets = targets.filter((o) => !o.dead);

    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    parts = parts.filter((p) => p.life > 0);

    for (const f of floats) {
      f.y -= 26 * dt;
      f.life -= dt;
    }
    floats = floats.filter((f) => f.life > 0);
  }

  function render() {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, theme[0]);
    grad.addColorStop(1, theme[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // dekor
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 26; i++) {
      const x = ((i * 53 + t * 9) % (W + 30)) - 15;
      const y = ((i * 97 + t * 14) % (H + 30)) - 15;
      g.beginPath();
      g.arc(x, y, 1.4, 0, Math.PI * 2);
      g.fill();
    }
    if (tType === "mole") {
      for (let i = 0; i < 9; i++) {
        const cx = 62 + (i % 3) * 98;
        const cy = 104 + Math.floor(i / 3) * 92;
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.beginPath();
        g.ellipse(cx, cy + 8, 34, 13, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (tType === "fruit") {
      g.fillStyle = "rgba(255,255,255,0.1)";
      g.fillRect(0, H - 26, W, 26);
    }

    for (const o of targets) drawTarget(g, o, t);

    for (const p of parts) {
      g.globalAlpha = clamp(p.life / p.max, 0, 1);
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    g.textAlign = "center";
    for (const f of floats) {
      g.globalAlpha = clamp(f.life / 0.8, 0, 1);
      g.fillStyle = f.color;
      g.font = "700 14px ui-monospace, monospace";
      g.fillText(f.text, f.x, f.y);
    }
    g.globalAlpha = 1;

    // HUD waktu
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(W / 2 - 52, 8, 104, 16);
    g.fillStyle = time < 6 ? "#fb7185" : "#4ee1ff";
    g.fillRect(W / 2 - 52, 8, 104 * clamp(time / duration, 0, 1), 16);
    g.fillStyle = "#e7ecf7";
    g.font = "700 11px ui-monospace, monospace";
    g.fillText(`${Math.ceil(time)}s`, W / 2, 20);
    if (combo >= 3) {
      g.fillStyle = "#ffd166";
      g.textAlign = "left";
      g.font = "700 12px ui-monospace, monospace";
      g.fillText(`x${combo}`, 12, 22);
    }
    g.textAlign = "center";
    g.fillStyle = "rgba(231,236,247,0.7)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("ketuk sasaran", W / 2, H - 10);
    g.textAlign = "left";
  }

  reset();
  st.loop((dt) => {
    update(dt);
    render();
  });

  return { destroy: st.destroy };
}
