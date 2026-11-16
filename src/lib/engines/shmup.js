// Engine tembak-tembakan vertikal (pesawat, UFO, asteroid, helikopter).
// Dipakai oleh pack shooters: player gerak bebas, auto-fire, power-up, boss.
import { createStage, clamp, rand, randInt, pick, sfx, roundRect } from "../kit.js";

const THEMES = {
  space: { top: "#04060f", bottom: "#101a38", dot: "#cfe6ff", stars: 46, accent: "#4ee1ff" },
  sky: { top: "#0b3d91", bottom: "#63c7f2", dot: "#ffffff", cloud: "rgba(255,255,255,0.34)", accent: "#ffe066" },
  sunset: { top: "#241046", bottom: "#ff8a5c", dot: "#ffd9a0", cloud: "rgba(255,200,160,0.28)", sun: true, accent: "#ffb347" },
  city: { top: "#080a18", bottom: "#231a3d", dot: "#8ea6ff", skyline: true, accent: "#a78bfa" },
  neon: { top: "#080312", bottom: "#1d0b33", dot: "#ff6bd6", grid: true, accent: "#ff6bd6" },
  ocean: { top: "#04263f", bottom: "#0f7d9c", dot: "#d7f9ff", wave: true, accent: "#4ee1ff" },
  night: { top: "#05070f", bottom: "#151c33", dot: "#e7ecf7", moon: true, accent: "#a3e635" },
  desert: { top: "#3b1d10", bottom: "#d99a4e", dot: "#ffe1b0", cloud: "rgba(255,230,190,0.22)", sun: true, accent: "#fbbf24" },
};

const S = 2.4; // skala gambar pesawat

function drawShip(g, x, y, type, color, down = false, scale = 1) {
  g.save();
  g.translate(x, y);
  g.scale(scale, scale);
  if (down) g.rotate(Math.PI);
  g.fillStyle = color;
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 0.6;
  if (type === "plane") {
    g.beginPath();
    g.moveTo(0, -13);
    g.lineTo(3.5, -5);
    g.lineTo(13, 1);
    g.lineTo(13, 5.5);
    g.lineTo(3.5, 3.5);
    g.lineTo(3, 10);
    g.lineTo(7.5, 13);
    g.lineTo(0, 11.5);
    g.lineTo(-7.5, 13);
    g.lineTo(-3, 10);
    g.lineTo(-3.5, 3.5);
    g.lineTo(-13, 5.5);
    g.lineTo(-13, 1);
    g.lineTo(-3.5, -5);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.beginPath();
    g.ellipse(0, -3, 1.8, 4, 0, 0, Math.PI * 2);
    g.fill();
  } else if (type === "jet") {
    g.beginPath();
    g.moveTo(0, -14);
    g.lineTo(2.6, -4);
    g.lineTo(12, 4);
    g.lineTo(12, 6.5);
    g.lineTo(2.6, 4);
    g.lineTo(2.2, 11);
    g.lineTo(0, 13);
    g.lineTo(-2.2, 11);
    g.lineTo(-2.6, 4);
    g.lineTo(-12, 6.5);
    g.lineTo(-12, 4);
    g.lineTo(-2.6, -4);
    g.closePath();
    g.fill();
  } else if (type === "heli") {
    g.beginPath();
    g.ellipse(0, -1, 4.5, 8, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(-1.2, 5, 2.4, 8.5);
    g.beginPath();
    g.moveTo(-7, 12);
    g.lineTo(7, 12);
    g.lineTo(5, 14);
    g.lineTo(-5, 14);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.7)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-11, -2);
    g.lineTo(11, -2);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.4)";
    g.beginPath();
    g.moveTo(0, 12);
    g.lineTo(0, 19);
    g.stroke();
  } else if (type === "rocket") {
    g.beginPath();
    g.moveTo(0, -15);
    g.lineTo(3.4, -6);
    g.lineTo(3, 9);
    g.lineTo(-3, 9);
    g.lineTo(-3.4, -6);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(-3, 5);
    g.lineTo(-8, 12);
    g.lineTo(-3, 11);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(3, 5);
    g.lineTo(8, 12);
    g.lineTo(3, 11);
    g.closePath();
    g.fill();
    g.fillStyle = "#ffb347";
    g.beginPath();
    g.moveTo(-2, 9);
    g.lineTo(0, 16 + Math.random() * 4);
    g.lineTo(2, 9);
    g.closePath();
    g.fill();
  } else if (type === "saucer") {
    g.beginPath();
    g.ellipse(0, 1, 13, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(0, -2, 6.5, 5, 0, 0, Math.PI * 2);
    g.fillStyle = "rgba(160,230,255,0.85)";
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.beginPath();
    g.ellipse(0, 1, 13, 5, 0, 0, Math.PI * 2);
    g.stroke();
  } else if (type === "drone") {
    g.beginPath();
    g.moveTo(0, -8);
    g.lineTo(9, 0);
    g.lineTo(0, 8);
    g.lineTo(-9, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-12, -7);
    g.lineTo(-7, -3);
    g.moveTo(12, -7);
    g.lineTo(7, -3);
    g.moveTo(-12, 7);
    g.lineTo(-7, 3);
    g.moveTo(12, 7);
    g.lineTo(7, 3);
    g.stroke();
    g.fillStyle = "#ff6b6b";
    g.beginPath();
    g.arc(0, 0, 2.2, 0, Math.PI * 2);
    g.fill();
  } else if (type === "asteroid") {
    g.beginPath();
    const pts = 8;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = 9 + Math.sin(i * 2.7) * 2.5;
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.arc(-3, -2, 2.4, 0, Math.PI * 2);
    g.arc(4, 3, 1.7, 0, Math.PI * 2);
    g.fill();
  } else {
    g.beginPath();
    g.moveTo(0, -12);
    g.lineTo(10, 0);
    g.lineTo(0, 12);
    g.lineTo(-10, 0);
    g.closePath();
    g.fill();
  }
  g.restore();
}

function drawBullet(g, b) {
  g.save();
  g.shadowBlur = 8;
  g.shadowColor = b.color;
  g.fillStyle = b.color;
  roundRect(g, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, b.w / 2);
  g.fill();
  g.restore();
}

export function createShmup(ctx, cfg = {}) {
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
  const theme = THEMES[cfg.theme] || THEMES.space;
  const accent = cfg.accent || theme.accent;

  const playerType = cfg.player || "plane";
  const enemyShape = cfg.enemy || "plane";
  const enemyColor = cfg.enemyColor || "#ff6b6b";
  const speedMul = cfg.speed ?? 1;
  const fireRate = cfg.fireRate ?? 0.17;
  const bossEvery = cfg.bossEvery ?? 18;
  const startLives = cfg.lives ?? 3;
  const scoreKill = cfg.scoreKill ?? 10;

  const stars = Array.from({ length: theme.stars || 30 }, () => ({
    x: rand(0, W),
    y: rand(0, H),
    z: rand(0.4, 1.6),
    r: rand(0.5, 1.7),
  }));
  const clouds = Array.from({ length: 6 }, () => ({ x: rand(0, W), y: rand(0, H), w: rand(28, 70), h: rand(9, 18), s: rand(14, 30) }));
  const skyline = Array.from({ length: 9 }, (_, i) => ({ x: i * 42 + rand(-8, 8), w: rand(22, 40), h: rand(26, 88), win: randInt(2, 8) }));

  const P = {
    x: W / 2,
    y: H - 62,
    tx: W / 2,
    ty: H - 62,
    cool: 0,
    spread: 0,
    spreadT: 0,
    shield: false,
    invuln: 0,
    alive: true,
  };
  let bullets = [];
  let ebullets = [];
  let enemies = [];
  let parts = [];
  let drops = [];
  let score = 0;
  let kills = 0;
  let lives = startLives;
  let over = false;
  let spawnT = 0.7;
  let wave = 1;
  let boss = null;
  let bossPending = false;
  let t = 0;
  let shake = 0;
  let scroll = 0;
  let combo = 0;
  let comboT = 0;

  const maxEnemies = cfg.maxEnemies ?? 9;

  function reset() {
    P.x = W / 2;
    P.y = H - 62;
    P.tx = P.x;
    P.ty = P.y;
    P.cool = 0;
    P.spread = 0;
    P.spreadT = 0;
    P.shield = false;
    P.invuln = 0;
    P.alive = true;
    bullets = [];
    ebullets = [];
    enemies = [];
    parts = [];
    drops = [];
    score = 0;
    kills = 0;
    lives = startLives;
    over = false;
    spawnT = 0.7;
    wave = 1;
    boss = null;
    bossPending = false;
    t = 0;
    shake = 0;
    scroll = 0;
    combo = 0;
    comboT = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  function addParts(x, y, color, n = 8, power = 90) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(power * 0.3, power);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.25, 0.6), max: 0.6, color, r: rand(1, 2.6) });
    }
  }

  function spawnEnemy(kind = "normal") {
    const roll = Math.random();
    let type = "straight";
    if (roll > 0.72) type = "hover";
    else if (roll > 0.42) type = "dive";
    const big = kind === "big";
    const e = {
      x: rand(24, W - 24),
      y: -22,
      r: big ? 15 : 10,
      hp: big ? 5 : type === "hover" ? 3 : 2,
      maxhp: 0,
      type,
      big,
      shape: enemyShape,
      phase: rand(0, Math.PI * 2),
      vy: (big ? 24 : rand(42, 62)) * speedMul,
      vx: 0,
      shootT: rand(0.5, 1.8),
      baseX: 0,
      flash: 0,
    };
    e.baseX = e.x;
    e.maxhp = e.hp;
    enemies.push(e);
  }

  function spawnBoss() {
    bossPending = false;
    boss = {
      x: W / 2,
      y: -56,
      r: 34,
      hp: 42 + wave * 12,
      maxhp: 42 + wave * 12,
      phase: 0,
      shootT: 1.2,
      mode: 0,
      flash: 0,
      entering: true,
    };
    sfx("over");
  }

  function shoot() {
    const lvl = P.spread > 0 ? 3 : 1;
    const colors = [accent, "#a3e635", "#ff6bd6"];
    for (let i = 0; i < lvl; i++) {
      const off = lvl === 1 ? 0 : (i - 1) * 6;
      bullets.push({ x: P.x + off, y: P.y - 15, vx: lvl === 1 ? 0 : off * 2.2, vy: -390, w: 3, h: 9, color: colors[i] || accent, dmg: 1 });
    }
    sfx("click");
  }

  function hurtPlayer() {
    if (P.invuln > 0 || over) return;
    if (P.shield) {
      P.shield = false;
      P.invuln = 0.8;
      addParts(P.x, P.y, "#4ee1ff", 14, 130);
      st.burst(P.x, P.y, { n: 14, color: "#4ee1ff", speed: 170, size: 2.6 });
      st.ring(P.x, P.y, { color: "#4ee1ff", r: 46, width: 2.4 });
      st.shake(6, 200);
      sfx("hit");
      return;
    }
    lives--;
    P.invuln = 1.8;
    shake = 12;
    addParts(P.x, P.y, "#ff6b6b", 22, 180);
    st.burst(P.x, P.y, { n: 22, color: "#ff7b7b", speed: 210, size: 3, gravity: 120 });
    st.flash("rgba(255,80,100,0.3)", 200);
    st.shake(12, 340);
    st.hitstop(70);
    sfx("hit");
    if (lives <= 0) {
      P.alive = false;
      endGame();
    }
  }

  function endGame() {
    if (over) return;
    over = true;
    st.flash("rgba(255,60,80,0.42)", 260);
    st.end({
      score,
      title: "Pesawat jatuh!",
      sub: `${score} poin · ${kills} musuh hancur`,
      retry: reset,
    });
  }

  function collectDrop(d) {
    if (d.kind === "spread") {
      P.spread = 1;
      P.spreadT = 12;
    } else if (d.kind === "shield") {
      P.shield = true;
      st.pop(d.x, d.y - 10, "SHIELD", { color: "#4ee1ff" });
    } else if (d.kind === "bomb") {
      ebullets = [];
      for (const e of enemies) e.hp -= 4;
      if (boss) boss.hp -= 10;
      shake = 10;
      st.flash("rgba(180,235,255,0.5)", 240);
      st.shake(14, 420);
      st.ring(W / 2, H / 2, { color: "#bfefff", r: 260, width: 4, life: 0.6 });
      st.pop(d.x, d.y - 10, "BOM!", { color: "#ffd166" });
    } else {
      st.pop(d.x, d.y - 10, "SPREAD", { color: "#a3e635" });
    }
    sfx("point");
  }

  st.onPointer((p, type) => {
    if (over) return;
    if (type === "down" || (type === "move" && p.down)) {
      P.tx = p.x;
      P.ty = p.y - 22;
    }
  });
  st.onTap((p) => {
    if (over) return;
    P.tx = p.x;
    P.ty = p.y - 22;
  });

  function update(dt) {
    t += dt;
    scroll += dt * 60;
    shake = Math.max(0, shake - dt * 40);
    if (over) return;

    // gerak pemain
    let vx = 0;
    let vy = 0;
    const sp = 215;
    if (st.isDown("left", "a")) vx -= sp;
    if (st.isDown("right", "d")) vx += sp;
    if (st.isDown("up", "w")) vy -= sp;
    if (st.isDown("down", "s")) vy += sp;
    if (vx || vy) {
      P.x += vx * dt;
      P.y += vy * dt;
      P.tx = P.x;
      P.ty = P.y;
    } else if (st.pointer.down) {
      const dx = P.tx - P.x;
      const dy = P.ty - P.y;
      const d = Math.hypot(dx, dy);
      const step = 420 * dt;
      if (d > 1) {
        P.x += (dx / d) * Math.min(step, d);
        P.y += (dy / d) * Math.min(step, d);
      }
    }
    P.x = clamp(P.x, 16, W - 16);
    P.y = clamp(P.y, 40, H - 18);

    if (P.invuln > 0) P.invuln -= dt;
    if (P.spreadT > 0) {
      P.spreadT -= dt;
      if (P.spreadT <= 0) P.spread = 0;
    }
    if (comboT > 0) {
      comboT -= dt;
      if (comboT <= 0) combo = 0;
    }

    // auto fire
    P.cool -= dt;
    if (P.cool <= 0) {
      shoot();
      P.cool = fireRate;
    }

    // spawn
    if (!boss && !bossPending) {
      spawnT -= dt;
      const cap = maxEnemies + Math.min(4, Math.floor(wave / 2));
      if (spawnT <= 0 && enemies.length < cap) {
        spawnEnemy(Math.random() < 0.14 ? "big" : "normal");
        spawnT = Math.max(0.22, (0.8 - wave * 0.03) / speedMul) * rand(0.7, 1.3);
      }
      if (kills > 0 && kills % bossEvery === 0 && !boss) {
        bossPending = true;
        spawnT = 0.7;
      }
    }
    if (bossPending && enemies.length === 0) spawnBoss();

    // musuh
    for (const e of enemies) {
      e.phase += dt * 2;
      e.flash = Math.max(0, e.flash - dt * 4);
      if (e.type === "hover") {
        e.y += e.vy * dt * 0.7;
        if (e.y > 70 + (e.big ? 16 : 0)) {
          e.y -= e.vy * dt * 0.7;
          e.x = e.baseX + Math.sin(e.phase * 0.6) * 34;
        }
        e.shootT -= dt;
        if (e.shootT <= 0) {
          e.shootT = rand(1.1, 2);
          const a = Math.atan2(P.y - e.y, P.x - e.x);
          ebullets.push({ x: e.x, y: e.y + 8, vx: Math.cos(a) * 105, vy: Math.sin(a) * 105, r: 3, color: "#ff8a8a" });
        }
      } else if (e.type === "dive" && e.y > 40) {
        const a = Math.atan2(P.y - e.y, P.x - e.x);
        e.vx = Math.cos(a) * 70 * speedMul;
        e.x += e.vx * dt;
        e.y += Math.sin(a) * 95 * speedMul * dt;
      } else {
        e.y += e.vy * dt;
        e.x = e.baseX + Math.sin(e.phase * 0.9) * (e.big ? 10 : 22);
      }
      e.x = clamp(e.x, 12, W - 12);
      if (e.y > H + 24) e.dead = true;
      // tabrak pemain
      if (Math.hypot(e.x - P.x, e.y - P.y) < e.r + 9) {
        e.hp = 0;
        hurtPlayer();
      }
    }

    // boss
    if (boss) {
      boss.flash = Math.max(0, boss.flash - dt * 4);
      if (boss.entering) {
        boss.y += 34 * dt;
        if (boss.y >= 58) {
          boss.entering = false;
          boss.y = 58;
        }
      } else {
        boss.phase += dt;
        boss.x = W / 2 + Math.sin(boss.phase * 0.8) * (W / 2 - 52);
        boss.shootT -= dt;
        if (boss.shootT <= 0) {
          boss.mode = (boss.mode + 1) % 3;
          if (boss.mode === 0) {
            for (let i = 0; i < 7; i++) {
              const a = Math.PI / 2 + (i - 3) * 0.22;
              ebullets.push({ x: boss.x, y: boss.y + 18, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, r: 3.2, color: "#ffd166" });
            }
            boss.shootT = 1.15;
          } else if (boss.mode === 1) {
            const a = Math.atan2(P.y - boss.y, P.x - boss.x);
            for (let i = -2; i <= 2; i++) {
              ebullets.push({ x: boss.x, y: boss.y + 14, vx: Math.cos(a + i * 0.13) * 150, vy: Math.sin(a + i * 0.13) * 150, r: 3, color: "#ff6b6b" });
            }
            boss.shootT = 0.8;
          } else {
            ebullets.push({ x: boss.x - 24, y: boss.y + 12, vx: 0, vy: 125, r: 4, color: "#a78bfa" });
            ebullets.push({ x: boss.x + 24, y: boss.y + 12, vx: 0, vy: 125, r: 4, color: "#a78bfa" });
            boss.shootT = 0.4;
          }
          if (boss.hp / boss.maxhp < 0.45) boss.shootT *= 0.62; // fase murka
          sfx("tick");
        }
        if (Math.hypot(boss.x - P.x, boss.y - P.y) < boss.r + 10) hurtPlayer();
      }
    }

    // peluru pemain
    for (const b of bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -14) b.dead = true;
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
          b.dead = true;
          e.hp -= b.dmg;
          e.flash = 1;
          addParts(b.x, b.y, accent, 3, 50);
          if (e.hp <= 0) {
            e.dead = true;
            kills++;
            combo++;
            comboT = 1.2;
            const gain = Math.round(scoreKill * (e.big ? 2.5 : 1) * (1 + Math.min(combo, 12) * 0.08));
            score += gain;
            st.setScore(score);
            addParts(e.x, e.y, enemyColor, e.big ? 18 : 10, e.big ? 170 : 110);
            st.burst(e.x, e.y, { n: e.big ? 16 : 8, color: enemyColor, speed: e.big ? 210 : 150, size: 2.6 });
            if (e.big) {
              st.ring(e.x, e.y, { color: enemyColor, r: 40, width: 2 });
              st.shake(6, 180);
            }
            if (combo >= 5) st.pop(e.x, e.y - 12, `x${combo}`, { color: "#ffd166", size: 12 });
            sfx("drop");
            if (Math.random() < (e.big ? 0.5 : 0.09)) {
              drops.push({ x: e.x, y: e.y, vy: 62, kind: pick(["spread", "spread", "shield", "bomb"]), spin: 0 });
            }
          }
          break;
        }
      }
      if (boss && !boss.entering && b.y < boss.y + boss.r && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.r) {
        b.dead = true;
        boss.hp -= b.dmg;
        boss.flash = 1;
        addParts(b.x, b.y, "#ffd166", 3, 60);
        if (boss.hp <= 0) {
          const bx = boss.x;
          const by = boss.y;
          boss = null;
          score += 300 + wave * 40;
          st.setScore(score);
          shake = 16;
          addParts(bx, by, "#ffd166", 40, 220);
          st.burst(bx, by, { n: 46, color: "#ffd166", speed: 300, size: 3.6, life: 0.9, gravity: 90 });
          st.ring(bx, by, { color: "#ffe9a8", r: 190, width: 4, life: 0.7 });
          st.flash("rgba(255,225,150,0.55)", 340);
          st.shake(18, 520);
          st.hitstop(130);
          st.pop(bx, by - 20, "BOSS DOWN", { color: "#ffe9a8", size: 14, life: 1.1 });
          sfx("win");
          drops.push({ x: bx - 18, y: by, vy: 54, kind: "spread", spin: 0 });
          drops.push({ x: bx + 18, y: by, vy: 54, kind: "shield", spin: 0 });
          wave++;
        }
      }
    }
    bullets = bullets.filter((b) => !b.dead);

    // peluru musuh
    for (const b of ebullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > H + 12 || b.y < -12 || b.x < -12 || b.x > W + 12) b.dead = true;
      else if (Math.hypot(b.x - P.x, b.y - P.y) < b.r + 7) {
        b.dead = true;
        hurtPlayer();
      }
    }
    ebullets = ebullets.filter((b) => !b.dead);
    enemies = enemies.filter((e) => !e.dead);

    // power-up
    for (const d of drops) {
      d.y += d.vy * dt;
      d.spin += dt * 4;
      if (d.y > H + 16) d.dead = true;
      else if (Math.hypot(d.x - P.x, d.y - P.y) < 17) {
        d.dead = true;
        collectDrop(d);
      }
    }
    drops = drops.filter((d) => !d.dead);

    // partikel
    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt;
    }
    parts = parts.filter((p) => p.life > 0);
    if (parts.length > 260) parts.splice(0, parts.length - 260);
  }

  /* ------------------------------- render -------------------------------- */
  function drawBackground() {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, theme.top);
    grad.addColorStop(1, theme.bottom);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    if (theme.sun) {
      g.save();
      g.globalAlpha = 0.85;
      const sg = g.createRadialGradient(W / 2, 78, 8, W / 2, 78, 62);
      sg.addColorStop(0, "#ffe7a3");
      sg.addColorStop(1, "rgba(255,170,80,0)");
      g.fillStyle = sg;
      g.beginPath();
      g.arc(W / 2, 78, 62, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    if (theme.moon) {
      g.save();
      g.fillStyle = "rgba(240,245,255,0.85)";
      g.beginPath();
      g.arc(W - 62, 58, 18, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = theme.top;
      g.beginPath();
      g.arc(W - 54, 52, 16, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    if (theme.grid) {
      g.strokeStyle = "rgba(255,107,214,0.16)";
      g.lineWidth = 1;
      const off = scroll % 26;
      for (let y = -26 + off; y < H; y += 26) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(W, y);
        g.stroke();
      }
      for (let x = 0; x < W; x += 32) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, H);
        g.stroke();
      }
    }
    if (theme.skyline) {
      g.fillStyle = "rgba(10,8,26,0.72)";
      for (const b of skyline) {
        const y = H - ((scroll * 0.35 + b.h) % (H + b.h)) - 20;
        g.fillRect(b.x, y, b.w, b.h);
      }
    }
    if (theme.wave) {
      g.strokeStyle = "rgba(255,255,255,0.14)";
      g.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const y = ((scroll * 0.8 + i * 70) % (H + 70)) - 35;
        g.beginPath();
        for (let x = 0; x <= W; x += 10) {
          const yy = y + Math.sin((x + scroll) * 0.05 + i) * 4;
          if (x === 0) g.moveTo(x, yy);
          else g.lineTo(x, yy);
        }
        g.stroke();
      }
    }
    if (theme.cloud) {
      g.fillStyle = theme.cloud;
      for (const c of clouds) {
        const y = ((c.y + scroll * 0.45) % (H + 60)) - 30;
        g.beginPath();
        g.ellipse(c.x, y, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.ellipse(c.x - c.w * 0.22, y + 2, c.w / 3, c.h / 2.4, 0, 0, Math.PI * 2);
        g.ellipse(c.x + c.w * 0.2, y - 2, c.w / 3.4, c.h / 2.2, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    // bintang
    g.fillStyle = theme.dot;
    for (const s of stars) {
      const y = ((s.y + scroll * s.z * 0.8) % (H + 8)) - 4;
      g.globalAlpha = 0.25 + s.z * 0.45;
      g.fillRect(s.x, y, s.r, s.r * 2.2);
    }
    g.globalAlpha = 1;
  }

  function drawHud() {
    // nyawa
    for (let i = 0; i < lives; i++) {
      drawShip(g, 18 + i * 17, 16, "plane", "#a3e635", false, 0.52);
    }
    g.fillStyle = "rgba(231,236,247,0.85)";
    g.font = "700 11px ui-monospace, monospace";
    g.textAlign = "right";
    g.fillText(`W${wave}`, W - 10, 18);
    if (P.shield) {
      g.strokeStyle = "rgba(78,225,255,0.8)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(P.x, P.y, 20 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
      g.stroke();
    }
    if (combo >= 3) {
      g.fillStyle = "#ffd166";
      g.textAlign = "center";
      g.font = "700 11px ui-monospace, monospace";
      g.fillText(`COMBO x${combo}`, W / 2, 18);
    }
    if (boss && !boss.entering) {
      g.fillStyle = "rgba(0,0,0,0.45)";
      roundRect(g, 40, 26, W - 80, 7, 3);
      g.fill();
      g.fillStyle = "#fb7185";
      roundRect(g, 40, 26, (W - 80) * clamp(boss.hp / boss.maxhp, 0, 1), 7, 3);
      g.fill();
    }
    g.textAlign = "left";
  }

  function render() {
    g.save();
    if (shake > 0) g.translate(rand(-shake, shake) * 0.4, rand(-shake, shake) * 0.4);
    drawBackground();

    // drop
    for (const d of drops) {
      g.save();
      g.translate(d.x, d.y);
      g.rotate(Math.sin(d.spin) * 0.25);
      const col = d.kind === "spread" ? "#ffd166" : d.kind === "shield" ? "#4ee1ff" : "#ff6bd6";
      g.shadowBlur = 10;
      g.shadowColor = col;
      g.fillStyle = "rgba(10,14,26,0.9)";
      roundRect(g, -8, -8, 16, 16, 4);
      g.fill();
      g.strokeStyle = col;
      g.lineWidth = 1.6;
      g.stroke();
      g.fillStyle = col;
      g.font = "700 9px ui-monospace, monospace";
      g.textAlign = "center";
      g.fillText(d.kind === "spread" ? "S" : d.kind === "shield" ? "D" : "B", 0, 3.2);
      g.restore();
    }

    // musuh
    for (const e of enemies) {
      if (e.flash > 0) {
        g.save();
        g.globalAlpha = e.flash * 0.5;
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(e.x, e.y, e.r + 3, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      drawShip(g, e.x, e.y, e.shape, enemyColor, true, (e.big ? 1.55 : 1) * 0.95);
    }

    // boss
    if (boss) {
      drawShip(g, boss.x, boss.y, "saucer", "#ff6b6b", false, 2.4);
      g.save();
      g.translate(boss.x, boss.y);
      g.strokeStyle = "rgba(255,107,107,0.45)";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 0, boss.r + 4, 0, Math.PI * 2);
      g.stroke();
      g.restore();
      if (boss.flash > 0) {
        g.save();
        g.globalAlpha = boss.flash * 0.5;
        g.fillStyle = "#fff";
        g.beginPath();
        g.arc(boss.x, boss.y, boss.r, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    }

    // peluru
    for (const b of ebullets) {
      g.save();
      g.shadowBlur = 8;
      g.shadowColor = b.color;
      g.fillStyle = b.color;
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    for (const b of bullets) drawBullet(g, b);

    // partikel
    for (const p of parts) {
      g.globalAlpha = clamp(p.life / p.max, 0, 1);
      g.fillStyle = p.color;
      g.beginPath();
      g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    // pemain
    if (P.alive) {
      if (!(P.invuln > 0 && Math.floor(t * 14) % 2)) {
        drawShip(g, P.x, P.y, playerType, cfg.playerColor || "#4ee1ff", false, 1);
        // api ekor
        g.fillStyle = "#ffb347";
        g.beginPath();
        g.moveTo(P.x - 2.4, P.y + 11);
        g.lineTo(P.x, P.y + 19 + Math.random() * 4);
        g.lineTo(P.x + 2.4, P.y + 11);
        g.closePath();
        g.fill();
      }
    }

    drawHud();
    g.restore();
  }

  st.loop((dt) => {
    update(dt);
    render();
  });

  return { destroy: st.destroy };
}
