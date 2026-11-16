// Engine lari/terbang: pelari otomatis, lompat/duck, mode terbang & jetpack.
import { createStage, clamp, rand, randInt, pick, sfx, roundRect } from "../kit.js";

const THEMES = {
  city: { sky: ["#0b1024", "#243056"], ground: "#131a2c", deco: "#2b3a6b", line: "rgba(120,180,255,0.35)" },
  desert: { sky: ["#3b1d10", "#e8a45c"], ground: "#7a4b2a", deco: "#c07a42", line: "rgba(255,230,190,0.4)" },
  jungle: { sky: ["#062017", "#0f5b3f"], ground: "#123d2c", deco: "#175e45", line: "rgba(140,255,200,0.3)" },
  cave: { sky: ["#05060f", "#1a1030"], ground: "#241735", deco: "#3a2352", line: "rgba(190,150,255,0.25)" },
  neon: { sky: ["#080312", "#2a0a3d"], ground: "#150726", deco: "#3b1059", line: "rgba(255,107,214,0.35)" },
  sky: { sky: ["#5eb8e8", "#bfe9ff"], ground: "#5b7fa8", deco: "rgba(255,255,255,0.5)", line: "rgba(255,255,255,0.5)" },
};

function drawRunner(g, x, y, type, color, duck, run, t) {
  g.save();
  g.translate(x, y);
  g.fillStyle = color;
  if (type === "dino") {
    if (duck) {
      roundRect(g, -15, -17, 30, 17, 6);
      g.fill();
      g.fillStyle = "#0f2b1f";
      g.fillRect(10, -14, 4, 3);
    } else {
      roundRect(g, -9, -34, 18, 33, 7);
      g.fill();
      g.beginPath();
      g.moveTo(9, -30);
      g.lineTo(18, -26);
      g.lineTo(18, -20);
      g.lineTo(9, -20);
      g.closePath();
      g.fill();
      g.fillStyle = "#0f2b1f";
      g.fillRect(26 - 12, -31, 3, 3);
      g.fillStyle = color;
      g.fillRect(-7, -3, 5, 3);
      g.fillRect(2, -3, 5, 3);
    }
  } else if (type === "bot") {
    g.fillStyle = color;
    roundRect(g, -10, -32, 20, 22, 5);
    g.fill();
    roundRect(g, -7, -10, 14, 10, 3);
    g.fill();
    g.fillStyle = "#4ee1ff";
    g.fillRect(-5, -26, 10, 5);
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(-8, -9, 5, 9);
    g.fillRect(3, -9, 5, 9);
  } else if (type === "jet") {
    g.fillStyle = color;
    roundRect(g, -8, -30, 16, 24, 7);
    g.fill();
    g.beginPath();
    g.arc(0, -35, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffb347";
    g.beginPath();
    g.moveTo(-5, -6);
    g.lineTo(0, 8 + Math.random() * 8);
    g.lineTo(5, -6);
    g.closePath();
    g.fill();
  } else if (type === "heli") {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(0, -17, 8, 11, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-1.6, -8, 3.2, 9);
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.fillRect(-14, -27, 28, 2);
    g.fillRect(-1, -27, 2, 8);
    g.fillStyle = "#ffb347";
    g.beginPath();
    g.moveTo(-5, -6);
    g.lineTo(0, 8 + Math.random() * 6);
    g.lineTo(5, -6);
    g.closePath();
    g.fill();
  } else if (type === "bird") {
    g.fillStyle = color;
    g.beginPath();
    g.ellipse(0, -14, 13, 8, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(10, -19, 5.5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(13, -20);
    g.lineTo(20, -18);
    g.lineTo(13, -16);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(0,0,0,0.3)";
    g.lineWidth = 2;
    const flap = Math.sin(t * 14) * 8;
    g.beginPath();
    g.moveTo(-4, -16);
    g.lineTo(-14, -16 - flap);
    g.stroke();
  } else {
    // human runner
    g.fillStyle = color;
    g.beginPath();
    g.arc(0, -31, 6, 0, Math.PI * 2);
    g.fill();
    roundRect(g, -6, -24, 12, 15, 4);
    g.fill();
    const swing = Math.sin(run * 13) * 8;
    g.strokeStyle = color;
    g.lineWidth = 4;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(-2, -10);
    g.lineTo(-2 + swing, 0);
    g.moveTo(2, -10);
    g.lineTo(2 - swing, 0);
    g.stroke();
    g.beginPath();
    g.moveTo(-4, -20);
    g.lineTo(-8 - swing * 0.5, -12);
    g.moveTo(4, -20);
    g.lineTo(8 + swing * 0.5, -12);
    g.stroke();
    if (duck) {
      g.fillStyle = color;
      roundRect(g, -12, -12, 24, 12, 5);
      g.fill();
    }
  }
  g.restore();
}

function drawObstacle(g, o, color) {
  g.fillStyle = color;
  if (o.kind === "spike") {
    g.beginPath();
    g.moveTo(o.x, o.y + o.h);
    g.lineTo(o.x + o.w / 2, o.y);
    g.lineTo(o.x + o.w, o.y + o.h);
    g.closePath();
    g.fill();
  } else if (o.kind === "drone") {
    g.save();
    g.translate(o.x + o.w / 2, o.y + o.h / 2);
    g.fillStyle = color;
    roundRect(g, -o.w / 2, -o.h / 2, o.w, o.h, 5);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.6)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(-o.w / 2 - 4, -o.h / 2);
    g.lineTo(o.w / 2 + 4, -o.h / 2);
    g.stroke();
    g.fillStyle = "#ffd166";
    g.beginPath();
    g.arc(0, 0, 2.6, 0, Math.PI * 2);
    g.fill();
    g.restore();
  } else if (o.kind === "bar") {
    roundRect(g, o.x, o.y, o.w, o.h, 4);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.3)";
    for (let i = 4; i < o.w; i += 10) g.fillRect(o.x + i, o.y + 2, 3, o.h - 4);
  } else {
    // crate / cactus / wall
    roundRect(g, o.x, o.y, o.w, o.h, o.kind === "cactus" ? 7 : 4);
    g.fill();
    if (o.kind === "crate") {
      g.strokeStyle = "rgba(0,0,0,0.28)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(o.x + 3, o.y + 3);
      g.lineTo(o.x + o.w - 3, o.y + o.h - 3);
      g.moveTo(o.x + o.w - 3, o.y + 3);
      g.lineTo(o.x + 3, o.y + o.h - 3);
      g.stroke();
    }
  }
}

export function createRunner(ctx, cfg = {}) {
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
  const theme = THEMES[cfg.theme] || THEMES.city;
  const mode = cfg.mode || "ground";
  const runnerType = cfg.runner || "human";
  const color = cfg.color || "#a3e635";
  const obsColor = cfg.obsColor || "#fb7185";
  const doubleJump = !!cfg.doubleJump;
  const groundY = H - 46;
  const gravity = cfg.gravity ?? (mode === "fly" ? 950 : 1500);

  let P, obstacles, coins, parts, dist, speed, over, spawnT, coinT, t, shake, run, jumps, duck, fuel;
  let best = 0;

  const baseSpeed = cfg.speed ?? (mode === "ground" ? 175 : 140);

  function reset() {
    P = { x: 62, y: mode === "ground" ? groundY : H / 2, vy: 0, onGround: mode === "ground" };
    obstacles = [];
    coins = [];
    parts = [];
    dist = 0;
    speed = baseSpeed;
    over = false;
    spawnT = 1.1;
    coinT = 1.8;
    t = 0;
    shake = 0;
    run = 0;
    jumps = 0;
    duck = false;
    fuel = 100;
    st.hideOverlay();
    st.setScore(0);
  }

  function flap() {
    if (over) return;
    if (mode === "ground") {
      if (P.onGround) {
        P.vy = -520;
        P.onGround = false;
        jumps = 1;
        sfx("flip");
      } else if (doubleJump && jumps < 2) {
        P.vy = -440;
        jumps = 2;
        sfx("flip");
      }
    } else {
      P.vy = mode === "fly" ? -300 : Math.max(P.vy - 150, -260);
      sfx("flip");
    }
  }

  st.onKeyDown((k) => {
    if (k === "space" || k === "up" || k === "enter") flap();
  });
  st.onTap(() => flap());

  function addParts(x, y, c, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(30, 160);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.2, 0.55), max: 0.55, color: c, r: rand(1, 2.4) });
    }
  }

  function spawn() {
    const r = Math.random();
    if (mode === "ground") {
      if (r < 0.42) {
        obstacles.push({ x: W + 20, y: groundY - 26, w: 16, h: 26, kind: pick(["cactus", "spike", "crate"]) });
      } else if (r < 0.72) {
        obstacles.push({ x: W + 20, y: groundY - 28, w: 26, h: 28, kind: "crate" });
      } else {
        obstacles.push({ x: W + 20, y: groundY - 52, w: 34, h: 24, kind: "bar" });
      }
    } else {
      const gap = mode === "jet" ? 128 : 140;
      const mid = rand(90, H - 120);
      obstacles.push({ x: W + 24, y: 0, w: 34, h: mid - gap / 2, kind: "wall" });
      obstacles.push({ x: W + 24, y: mid + gap / 2, w: 34, h: H - (mid + gap / 2), kind: "wall", passed: false });
    }
  }

  function spawnCoin() {
    const y = mode === "ground" ? groundY - rand(30, 110) : rand(70, H - 90);
    coins.push({ x: W + 18, y, r: 8, phase: rand(0, 6) });
  }

  function crash() {
    if (over) return;
    over = true;
    shake = 12;
    addParts(P.x, P.y - 14, "#ffb347", 20);
    sfx("hit");
    best = Math.max(best, Math.floor(dist));
    st.end({
      score: Math.floor(dist),
      title: mode === "ground" ? "Aduh jatuh!" : "Nabrak! 💥",
      sub: `${Math.floor(dist)} m · rekor ${best} m`,
      retry: reset,
    });
  }

  function update(dt) {
    if (over) return;
    t += dt;
    run += dt;
    shake = Math.max(0, shake - dt * 40);

    speed = baseSpeed + Math.min(260, dist * 0.16);
    dist += (speed * dt) / 8;
    st.setScore(Math.floor(dist));

    // gerak vertikal
    if (mode === "ground") {
      duck = st.isDown("down", "s");
      P.vy += gravity * dt;
      P.y += P.vy * dt;
      if (P.y >= groundY) {
        P.y = groundY;
        P.vy = 0;
        P.onGround = true;
        jumps = 0;
      }
    } else if (mode === "fly") {
      P.vy += gravity * dt;
      P.y += P.vy * dt;
      if (P.y < 26) {
        P.y = 26;
        P.vy = 0;
      }
      if (P.y > H - 30) {
        P.y = H - 30;
        P.vy = 0;
      }
    } else {
      // jetpack: tahan atas/spasi untuk dorong
      const thrust = st.isDown("up", "w", "space");
      if (thrust && fuel > 0) {
        P.vy -= 1250 * dt;
        fuel = Math.max(0, fuel - 46 * dt);
      }
      fuel = Math.min(100, fuel + 24 * dt);
      P.vy += gravity * 0.62 * dt;
      P.vy = clamp(P.vy, -270, 320);
      P.y += P.vy * dt;
      if (P.y < 28) {
        P.y = 28;
        P.vy = Math.max(0, P.vy);
      }
      if (P.y > H - 26) {
        P.y = H - 26;
        P.vy = Math.min(0, P.vy);
      }
    }

    // spawn
    spawnT -= dt;
    if (spawnT <= 0) {
      spawn();
      spawnT = Math.max(0.55, (1.15 - dist * 0.0009) * rand(0.8, 1.25));
    }
    coinT -= dt;
    if (coinT <= 0) {
      spawnCoin();
      coinT = rand(0.8, 2.2);
    }

    // rintangan
    for (const o of obstacles) {
      o.x -= speed * dt;
      if (o.x + o.w < -10) o.dead = true;

      if (mode !== "ground" && o.kind === "wall" && !o.passed && o.x + o.w < P.x) {
        o.passed = true;
        if (o.y === 0) {
          dist += 8;
          sfx("point");
        }
      }

      if (mode === "ground") {
        const ph = duck ? 20 : 34;
        const pw = duck ? 24 : 18;
        const top = P.y - ph;
        if (P.x + pw / 2 > o.x && P.x - pw / 2 < o.x + o.w && P.y > o.y && top < o.y + o.h) crash();
      } else if (o.kind === "wall") {
        if (P.x + 11 > o.x && P.x - 11 < o.x + o.w && P.y + 11 > o.y && P.y - 11 < o.y + o.h) crash();
      }
    }
    obstacles = obstacles.filter((o) => !o.dead);

    // koin
    for (const c of coins) {
      c.x -= speed * dt;
      c.phase += dt * 5;
      if (c.x < -14) c.dead = true;
      else if (Math.hypot(c.x - P.x, c.y - (P.y - (mode === "ground" ? 18 : 4))) < 18) {
        c.dead = true;
        dist += 6;
        addParts(c.x, c.y, "#fbbf24", 6);
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
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, theme.sky[0]);
    grad.addColorStop(1, theme.sky[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // dekorasi parallax
    if (mode === "ground") {
      g.fillStyle = theme.deco;
      for (let i = 0; i < 7; i++) {
        const bw2 = 34 + (i % 3) * 14;
        const x = ((i * 74 - dist * 4) % (W + 120)) - 60;
        const hh = 40 + (i % 4) * 20;
        g.globalAlpha = 0.5;
        g.fillRect(x, groundY - hh, bw2, hh);
      }
      g.globalAlpha = 1;
      g.fillStyle = theme.ground;
      g.fillRect(0, groundY, W, H - groundY);
      g.fillStyle = theme.line;
      g.fillRect(0, groundY, W, 2);
      for (let i = 0; i < 24; i++) {
        const x = ((i * 30 - dist * 22) % (W + 30)) - 15;
        g.fillRect(x, groundY + 12 + (i % 3) * 8, 12, 2);
      }
    } else {
      // dinding/atap gua
      g.fillStyle = theme.deco;
      g.globalAlpha = 0.55;
      for (let i = 0; i < 10; i++) {
        const x = ((i * 46 - dist * 7) % (W + 46)) - 20;
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x + 20, 22 + (i % 3) * 12);
        g.lineTo(x + 40, 0);
        g.closePath();
        g.fill();
      }
      g.globalAlpha = 1;
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
      g.restore();
    }

    // rintangan
    for (const o of obstacles) drawObstacle(g, o, obsColor);

    // pemain
    drawRunner(g, P.x, P.y, runnerType, color, duck && mode === "ground", run, t);

    // partikel
    for (const p of parts) {
      g.globalAlpha = clamp(p.life / p.max, 0, 1);
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    // HUD
    g.fillStyle = "rgba(231,236,247,0.88)";
    g.font = "700 11px ui-monospace, monospace";
    g.textAlign = "left";
    g.fillText(`${Math.floor(dist)} m`, 12, 20);
    if (mode === "jet") {
      g.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(g, W - 76, 12, 64, 7, 3);
      g.fill();
      g.fillStyle = fuel > 25 ? "#4ee1ff" : "#fb7185";
      roundRect(g, W - 76, 12, 64 * (fuel / 100), 7, 3);
      g.fill();
    }
    g.restore();
  }

  reset();
  st.loop((dt) => {
    update(dt);
    render();
  });

  return { destroy: st.destroy };
}
