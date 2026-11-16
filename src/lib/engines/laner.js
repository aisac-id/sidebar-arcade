// Engine balap/hindar lajur: jalan bergulir, kendaraan digeser kiri-kanan,
// hindari lalu lintas / batu / palang, ambil koin. Dipakai pack racing.
import { createStage, clamp, rand, randInt, pick, sfx, roundRect } from "../kit.js";

const THEMES = {
  highway: { grass: "#12351f", road: "#2b3140", edge: "#f8fafc", dash: "rgba(255,255,255,0.75)", lane: "rgba(255,255,255,0.08)", coin: "#fbbf24" },
  night: { grass: "#0a0c16", road: "#181c2b", edge: "#4ee1ff", dash: "rgba(78,225,255,0.7)", lane: "rgba(78,225,255,0.06)", coin: "#ffd166" },
  desert: { grass: "#b97a42", road: "#5c4433", edge: "#ffe7bf", dash: "rgba(255,240,210,0.8)", lane: "rgba(255,255,255,0.06)", coin: "#fde047" },
  subway: { grass: "#0b0d14", road: "#1c1f2b", edge: "#f472b6", dash: "rgba(244,114,182,0.55)", lane: "rgba(244,114,182,0.05)", coin: "#fbbf24" },
  ocean: { grass: "#083b57", road: "#0d5e80", edge: "#a5f3fc", dash: "rgba(255,255,255,0.35)", lane: "rgba(255,255,255,0.05)", coin: "#fbbf24" },
  sky: { grass: "#8ed4ff", road: "#b9e5ff", edge: "#ffffff", dash: "rgba(255,255,255,0.8)", lane: "rgba(255,255,255,0.05)", coin: "#fbbf24" },
};

function drawVehicle(g, x, y, type, color, scale = 1, flip = false) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale * (flip ? -1 : 1));
  g.fillStyle = color;
  g.strokeStyle = "rgba(0,0,0,0.25)";
  g.lineWidth = 1;
  if (type === "bike") {
    g.beginPath();
    g.ellipse(0, 0, 5.5, 13, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#111827";
    g.beginPath();
    g.ellipse(0, -1, 3, 7, 0, 0, Math.PI * 2);
    g.fill();
  } else if (type === "truck") {
    roundRect(g, -11, -18, 22, 38, 5);
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.28)";
    g.fillRect(-9, 2, 18, 13);
    g.fillStyle = "rgba(180,230,255,0.7)";
    g.fillRect(-8, -13, 16, 7);
  } else if (type === "boat") {
    g.beginPath();
    g.moveTo(0, -18);
    g.quadraticCurveTo(11, 4, 7, 16);
    g.lineTo(-7, 16);
    g.quadraticCurveTo(-11, 4, 0, -18);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.65)";
    g.fillRect(-2, -8, 4, 16);
  } else if (type === "train") {
    roundRect(g, -12, -22, 24, 44, 4);
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.32)";
    for (let i = -14; i < 18; i += 9) g.fillRect(-8, i, 16, 4);
  } else if (type === "plane") {
    g.beginPath();
    g.moveTo(0, -20);
    g.lineTo(4, -4);
    g.lineTo(16, 4);
    g.lineTo(16, 8);
    g.lineTo(4, 5);
    g.lineTo(3, 14);
    g.lineTo(9, 18);
    g.lineTo(0, 16);
    g.lineTo(-9, 18);
    g.lineTo(-3, 14);
    g.lineTo(-4, 5);
    g.lineTo(-16, 8);
    g.lineTo(-16, 4);
    g.lineTo(-4, -4);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.65)";
    g.beginPath();
    g.ellipse(0, -5, 2, 5, 0, 0, Math.PI * 2);
    g.fill();
  } else if (type === "hover") {
    g.beginPath();
    g.ellipse(0, 0, 11, 16, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.6)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.ellipse(0, 0, 11, 16, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "rgba(120,240,255,0.9)";
    g.beginPath();
    g.ellipse(0, 4, 7, 4, 0, 0, Math.PI * 2);
    g.fill();
  } else {
    // car
    roundRect(g, -10, -16, 20, 32, 5);
    g.fill();
    g.fillStyle = "rgba(180,230,255,0.75)";
    roundRect(g, -7, -11, 14, 8, 2);
    g.fill();
    roundRect(g, -7, 6, 14, 5, 2);
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(-10, -6, 20, 2);
  }
  g.restore();
}

export function createLaner(ctx, cfg = {}) {
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
  const theme = THEMES[cfg.theme] || THEMES.highway;
  const lanes = cfg.lanes ?? 3;
  const laneW = W / lanes;
  const carType = cfg.car || "car";
  const obsType = cfg.obstacle || "car";
  const carColor = cfg.color || "#4ee1ff";
  const obsColor = cfg.obsColor || "#ef4444";
  const baseSpeed = cfg.speed ?? 190;
  const maxLives = cfg.lives ?? 2;
  const coinsOn = cfg.coins !== false;

  const P = { x: W / 2, y: H - 58, invuln: 0, alive: true };
  let obstacles = [];
  let coins = [];
  let parts = [];
  let dist = 0;
  let speed = baseSpeed;
  let lives = maxLives;
  let over = false;
  let spawnT = 0.6;
  let coinT = 1.4;
  let scroll = 0;
  let shake = 0;
  let t = 0;
  let bestDist = 0;

  function reset() {
    P.x = W / 2;
    P.y = H - 58;
    P.invuln = 0;
    P.alive = true;
    obstacles = [];
    coins = [];
    parts = [];
    dist = 0;
    speed = baseSpeed;
    lives = maxLives;
    over = false;
    spawnT = 0.6;
    coinT = 1.4;
    scroll = 0;
    shake = 0;
    t = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  function laneX(i) {
    return laneW * (i + 0.5);
  }

  function addParts(x, y, color, n = 10, power = 140) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(30, power);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.25, 0.6), max: 0.6, color, r: rand(1, 2.4) });
    }
  }

  function spawnObstacle() {
    const lane = randInt(0, lanes - 1);
    // jangan tutup semua lajur
    const busy = new Set(obstacles.filter((o) => o.y > -20 && o.y < 90).map((o) => o.lane));
    if (busy.size >= lanes - 1) return;
    if (busy.has(lane)) return;
    obstacles.push({
      lane,
      x: laneX(lane),
      y: -30,
      w: laneW * 0.62,
      h: 34,
      type: obsType,
      color: obsColor,
      passed: false,
      spin: rand(-1, 1),
    });
  }

  function spawnCoin() {
    const lane = randInt(0, lanes - 1);
    coins.push({ x: laneX(lane), y: -20, r: 8, lane, phase: rand(0, 6) });
  }

  function crash(o) {
    if (P.invuln > 0 || over) return;
    lives--;
    P.invuln = 1.6;
    shake = 12;
    addParts(P.x, P.y - 6, "#ffb347", 18, 200);
    sfx("hit");
    if (lives <= 0) {
      P.alive = false;
      over = true;
      bestDist = Math.max(bestDist, Math.floor(dist));
      st.end({
        score: Math.floor(dist),
        title: "Tabrakan! 💥",
        sub: `${Math.floor(dist)} m · ${bestDist} m terbaik`,
        retry: reset,
      });
    }
  }

  st.onPointer((p, type) => {
    if (over) return;
    if (type === "down" || (type === "move" && p.down)) P.x = clamp(p.x, 18, W - 18);
  });

  function update(dt) {
    t += dt;
    scroll += speed * dt;
    shake = Math.max(0, shake - dt * 40);
    if (over) return;

    if (P.invuln > 0) P.invuln -= dt;

    let dir = 0;
    if (st.isDown("left", "a")) dir -= 1;
    if (st.isDown("right", "d")) dir += 1;
    if (dir) P.x += dir * 280 * dt;
    P.x = clamp(P.x, 20, W - 20);

    // kecepatan naik pelan-pelan
    speed = baseSpeed + Math.min(320, dist * 0.22);
    dist += (speed * dt) / 9;
    st.setScore(Math.floor(dist));

    // spawn
    spawnT -= dt;
    if (spawnT <= 0) {
      spawnObstacle();
      spawnT = Math.max(0.28, (0.72 - dist * 0.0006) * rand(0.75, 1.35));
    }
    if (coinsOn) {
      coinT -= dt;
      if (coinT <= 0) {
        spawnCoin();
        coinT = rand(0.9, 2.2);
      }
    }

    for (const o of obstacles) {
      o.y += speed * dt;
      o.x = laneX(o.lane);
      if (o.y > H + 40) o.dead = true;
      if (Math.abs(o.x - P.x) < (o.w + 15) / 2 && Math.abs(o.y - P.y) < (o.h + 26) / 2) {
        o.dead = true;
        crash(o);
      }
    }
    obstacles = obstacles.filter((o) => !o.dead);

    for (const c of coins) {
      c.y += speed * dt;
      c.phase += dt * 5;
      if (c.y > H + 20) c.dead = true;
      else if (Math.hypot(c.x - P.x, c.y - P.y) < 16) {
        c.dead = true;
        dist += 12;
        st.setScore(Math.floor(dist));
        addParts(c.x, c.y, "#fbbf24", 6, 90);
        sfx("point");
      }
    }
    coins = coins.filter((c) => !c.dead);

    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    parts = parts.filter((p) => p.life > 0);
  }

  function render() {
    g.save();
    if (shake > 0) g.translate(rand(-shake, shake) * 0.4, rand(-shake, shake) * 0.4);
    g.fillStyle = theme.grass;
    g.fillRect(0, 0, W, H);
    // rumput / air bergerak
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 14; i++) {
      const y = ((i * 44 + scroll * 0.5) % (H + 60)) - 30;
      g.fillRect(0, y, W, 2);
    }
    // badan jalan
    const roadPad = W * 0.05;
    g.fillStyle = theme.road;
    g.fillRect(roadPad, 0, W - roadPad * 2, H);
    // garis tepi
    g.fillStyle = theme.edge;
    g.globalAlpha = 0.65;
    g.fillRect(roadPad + 3, 0, 3, H);
    g.fillRect(W - roadPad - 6, 0, 3, H);
    g.globalAlpha = 1;
    // pembatas lajur putus-putus
    g.fillStyle = theme.dash;
    const dashH = 22;
    const gap = 20;
    for (let i = 1; i < lanes; i++) {
      const x = laneW * i;
      for (let y = -dashH + (scroll % (dashH + gap)); y < H; y += dashH + gap) {
        g.fillRect(x - 1.4, y, 2.8, dashH);
      }
    }
    // koin
    for (const c of coins) {
      g.save();
      g.translate(c.x, c.y);
      g.scale(Math.cos(c.phase) * 0.35 + 0.65, 1);
      g.fillStyle = "#fbbf24";
      g.shadowBlur = 8;
      g.shadowColor = "#fbbf24";
      g.beginPath();
      g.arc(0, 0, c.r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#92400e";
      g.font = "700 9px ui-monospace, monospace";
      g.textAlign = "center";
      g.fillText("$", 0, 3);
      g.restore();
    }
    // rintangan
    for (const o of obstacles) {
      g.save();
      g.translate(o.x, o.y);
      g.rotate(o.spin * 0.02);
      drawVehicle(g, 0, 0, o.type, o.color, 0.95, true);
      g.restore();
    }
    // pemain
    if (P.alive && !(P.invuln > 0 && Math.floor(t * 14) % 2)) {
      drawVehicle(g, P.x, P.y, carType, carColor, 1, false);
      // bayangan
    }
    // partikel
    for (const p of parts) {
      g.globalAlpha = clamp(p.life / p.max, 0, 1);
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    // HUD nyawa
    for (let i = 0; i < maxLives; i++) {
      g.fillStyle = i < lives ? "#fb7185" : "rgba(255,255,255,0.18)";
      g.beginPath();
      const x = W - 16 - i * 15;
      g.arc(x, 18, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "rgba(231,236,247,0.85)";
    g.font = "700 11px ui-monospace, monospace";
    g.textAlign = "left";
    g.fillText(`${Math.floor(dist)} m`, 12, 20);
    g.restore();
  }

  st.loop((dt) => {
    update(dt);
    render();
  });

  return { destroy: st.destroy };
}
