// Engine pecah-bata: paddle, bola, grid bata, power-up, mode bata turun.
import { createStage, clamp, rand, pick, sfx, roundRect } from "../kit.js";

const PALETTE = ["#4ee1ff", "#a78bfa", "#ff6bd6", "#a3e635", "#fbbf24", "#fb7185", "#38bdf8", "#f472b6"];
const POWERS = [
  { id: "wide", color: "#4ee1ff", label: "W" },
  { id: "multi", color: "#a3e635", label: "M" },
  { id: "slow", color: "#ffd166", label: "S" },
  { id: "life", color: "#fb7185", label: "+" },
];

export function createBricks(ctx, cfg = {}) {
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

  const cols = cfg.cols ?? 8;
  const rowsBase = cfg.rows ?? 6;
  const margin = 14;
  const top = 54;
  const gap = 4;
  const bw = (W - margin * 2 - gap * (cols - 1)) / cols;
  const bh = cfg.brickH ?? 16;
  const baseSpeed = cfg.ballSpeed ?? 235;
  const paddleBase = cfg.paddle ?? 64;
  const descend = !!cfg.descend;
  const bombs = !!cfg.bombs;
  const bg = cfg.bg || ["#070b16", "#111a2e"];

  let paddle, balls, bricks, drops, parts, score, lives, level, over, launched, wideT, slowT, dropT, t, shake;
  let combo = 0;
  let descendT;
  let best = 0;

  function buildLevel(lv) {
    const rows = Math.min(9, rowsBase + Math.floor(lv / 2));
    bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let hp = 1;
        if (cfg.hpPattern === "rows") hp = 1 + Math.floor((rows - r) / 3);
        else if (cfg.hpPattern === "random") hp = Math.random() < 0.18 ? 2 : 1;
        else if (cfg.hpPattern === "checker") hp = (r + c) % 4 === 0 ? 2 : 1;
        bricks.push({
          x: margin + c * (bw + gap),
          y: top + r * (bh + gap),
          w: bw,
          h: bh,
          hp,
          max: hp,
          row: r,
          alive: true,
          bomb: bombs && (hp === 1 && Math.random() < 0.08),
          flash: 0,
        });
      }
    }
  }

  function newBall(x, y, vx, vy) {
    return { x, y, vx, vy, r: 4.6, trail: [] };
  }

  function reset(full = true) {
    paddle = { x: W / 2, w: paddleBase, h: 9 };
    balls = [newBall(W / 2, H - 44, 0, 0)];
    drops = [];
    parts = [];
    score = 0;
    lives = cfg.lives ?? 3;
    level = 1;
    over = false;
    launched = false;
    wideT = 0;
    slowT = 0;
    dropT = 0;
    t = 0;
    shake = 0;
    combo = 0;
    descendT = 1.6;
    buildLevel(1);
    if (full) st.setScore(0);
    st.hideOverlay();
  }

  function launch() {
    if (launched || over) return;
    launched = true;
    const a = rand(-0.55, 0.55) - Math.PI / 2;
    const sp = baseSpeed;
    const b = balls[0];
    b.vx = Math.cos(a) * sp;
    b.vy = Math.sin(a) * sp;
    sfx("flip");
  }

  function addParts(x, y, color, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(30, 150);
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.2, 0.5), max: 0.5, color, r: rand(1, 2.4) });
    }
  }

  function loseLife() {
    lives--;
    shake = 10;
    combo = 0;
    st.flash("rgba(255,90,110,0.3)", 200);
    st.shake(10, 320);
    st.burst(paddle.x, H - 40, { n: 16, color: "#fb7185", speed: 190, size: 2.8, gravity: 140 });
    sfx("hit");
    if (lives <= 0) {
      over = true;
      st.end({ score, title: "Bola habis!", sub: `Skor ${score}`, retry: () => reset(true) });
      return;
    }
    launched = false;
    paddle.w = paddleBase;
    balls = [newBall(paddle.x, H - 44, 0, 0)];
    drops = [];
  }

  function spawnDrop(x, y) {
    if (Math.random() > 0.16) return;
    const p = pick(POWERS);
    drops.push({ x, y, vy: 80, ...p });
  }

  function collect(p) {
    if (p.id === "wide") {
      paddle.w = Math.min(112, paddle.w + 22);
      wideT = 8;
    } else if (p.id === "multi") {
      const src = balls[0];
      if (src) {
        for (const a of [-0.4, 0.4]) {
          const sp = Math.hypot(src.vx, src.vy) || baseSpeed;
          const ang = Math.atan2(src.vy, src.vx) + a;
          balls.push(newBall(src.x, src.y, Math.cos(ang) * sp, Math.sin(ang) * sp));
        }
      }
    } else if (p.id === "slow") {
      slowT = 6;
    } else if (p.id === "life") {
      lives = Math.min(5, lives + 1);
    }
    st.pop(p.x, H - 54, p.id.toUpperCase(), { color: p.color, size: 10 });
    st.ring(p.x, H - 44, { color: p.color, r: 40, width: 2 });
    sfx("point");
  }

  function hitBrick(b) {
    b.hp--;
    b.flash = 1;
    if (b.hp > 0) {
      sfx("tick");
      return;
    }
    b.alive = false;
    combo++;
    const gain = Math.round((b.bomb ? 15 : 10) * (1 + Math.min(combo, 12) * 0.05));
    score += gain;
    st.setScore(score);
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    const col = PALETTE[b.row % PALETTE.length];
    addParts(bx, by, col, 7);
    st.burst(bx, by, { n: 7, color: col, speed: 150, size: 2.2, life: 0.4 });
    if (combo > 0 && combo % 5 === 0) {
      st.pop(bx, by - 8, `x${combo}`, { color: "#ffd166", size: 11 });
      st.ring(bx, by, { color: "#ffd166", r: 34, width: 1.8 });
    }
    spawnDrop(bx, by);
    sfx("drop");
    if (b.bomb) {
      shake = 8;
      st.shake(10, 320);
      st.flash("rgba(255,180,80,0.28)", 200);
      st.ring(bx, by, { color: "#ffb347", r: 70, width: 3, life: 0.45 });
      addParts(bx, by, "#ffb347", 22);
      for (const o of bricks) {
        if (!o.alive) continue;
        const dx = o.x + o.w / 2 - (b.x + b.w / 2);
        const dy = o.y + o.h / 2 - (b.y + b.h / 2);
        if (Math.hypot(dx, dy) < 46) {
          o.hp = 0;
          o.alive = false;
          score += 5;
          addParts(o.x + o.w / 2, o.y + o.h / 2, "#ffb347", 5);
        }
      }
      st.setScore(score);
    }
  }

  function nextLevel() {
    level++;
    score += 40 * level;
    st.setScore(score);
    st.flash("rgba(160,230,255,0.3)", 260);
    st.shake(8, 300);
    st.pop(W / 2, H / 2 - 30, `LEVEL ${level}`, { color: "#4ee1ff", size: 14, life: 1 });
    sfx("win");
    wideT = 0;
    slowT = 0;
    paddle.w = paddleBase;
    buildLevel(level);
    balls = [newBall(paddle.x, H - 44, 0, 0)];
    launched = false;
    descendT = 1.6;
  }

  st.onTap(() => launch());
  st.onKeyDown((k) => {
    if (k === "space" || k === "enter") launch();
  });
  st.onPointer((p, type) => {
    if (over) return;
    if (type === "down") launch();
    if (type === "down" || (type === "move" && p.down)) paddle.x = clamp(p.x, paddle.w / 2, W - paddle.w / 2);
  });

  function update(dt) {
    if (over) return;
    t += dt;
    shake = Math.max(0, shake - dt * 40);
    if (wideT > 0) {
      wideT -= dt;
      if (wideT <= 0) paddle.w = paddleBase;
    }
    if (slowT > 0) slowT -= dt;

    // paddle
    if (st.isDown("left", "a")) paddle.x -= 300 * dt;
    if (st.isDown("right", "d")) paddle.x += 300 * dt;
    paddle.x = clamp(paddle.x, paddle.w / 2, W - paddle.w / 2);

    if (!launched) {
      balls[0].x = paddle.x;
      balls[0].y = H - 44;
    }

    const slowFactor = slowT > 0 ? 0.68 : 1;

    for (const b of balls) {
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 6) b.trail.shift();
      if (!launched) continue;
      b.x += b.vx * dt * slowFactor;
      b.y += b.vy * dt * slowFactor;

      if (b.x < b.r) {
        b.x = b.r;
        b.vx = Math.abs(b.vx);
      } else if (b.x > W - b.r) {
        b.x = W - b.r;
        b.vx = -Math.abs(b.vx);
      }
      if (b.y < 40 + b.r) {
        b.y = 40 + b.r;
        b.vy = Math.abs(b.vy);
      }
      if (b.y > H + 14) {
        b.dead = true;
        continue;
      }

      // paddle
      if (b.vy > 0 && b.y + b.r >= H - 44 && b.y - b.r < H - 38 && Math.abs(b.x - paddle.x) < paddle.w / 2 + b.r) {
        b.y = H - 44 - b.r;
        const rel = clamp((b.x - paddle.x) / (paddle.w / 2), -1, 1);
        const sp = Math.max(baseSpeed * 0.9, Math.hypot(b.vx, b.vy));
        const ang = -Math.PI / 2 + rel * 0.95;
        b.vx = Math.cos(ang) * sp;
        b.vy = Math.sin(ang) * sp;
        combo = 0;
        st.ring(b.x, b.y, { color: "#4ee1ff", r: 18, width: 1.4, life: 0.25 });
        sfx("flip");
      }

      // bata
      for (const br of bricks) {
        if (!br.alive) continue;
        const cx = clamp(b.x, br.x, br.x + br.w);
        const cy = clamp(b.y, br.y, br.y + br.h);
        if ((b.x - cx) ** 2 + (b.y - cy) ** 2 > b.r * b.r) continue;
        const dx = b.x - (br.x + br.w / 2);
        const dy = b.y - (br.y + br.h / 2);
        if (Math.abs(dx / (br.w / 2)) > Math.abs(dy / (br.h / 2))) {
          b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx);
          b.x = dx > 0 ? br.x + br.w + b.r : br.x - b.r;
        } else {
          b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy);
          b.y = dy > 0 ? br.y + br.h + b.r : br.y - b.r;
        }
        hitBrick(br);
        break;
      }
    }
    balls = balls.filter((b) => !b.dead);
    if (!balls.length) loseLife();

    // power-up
    for (const d of drops) {
      d.y += d.vy * dt;
      if (d.y > H + 12) d.dead = true;
      else if (Math.abs(d.x - paddle.x) < paddle.w / 2 + 8 && Math.abs(d.y - (H - 40)) < 12) {
        d.dead = true;
        collect(d);
      }
    }
    drops = drops.filter((d) => !d.dead);

    // bata turun
    if (descend) {
      descendT -= dt;
      if (descendT <= 0) {
        descendT = Math.max(1.1, 2.4 - level * 0.15);
        let hitBottom = false;
        for (const br of bricks) {
          if (!br.alive) continue;
          br.y += 6;
          if (br.y + br.h >= H - 52) hitBottom = true;
        }
        if (hitBottom) {
          over = true;
          st.end({ score, title: "Bata menembus!", sub: `Skor ${score}`, retry: () => reset(true) });
          return;
        }
      }
    }

    // partikel
    for (const p of parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    parts = parts.filter((p) => p.life > 0);

    if (!bricks.some((b) => b.alive)) nextLevel();
  }

  function render() {
    g.save();
    if (shake > 0) g.translate(rand(-shake, shake) * 0.4, rand(-shake, shake) * 0.4);
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bg[0]);
    grad.addColorStop(1, bg[1]);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    // bata
    for (const br of bricks) {
      if (!br.alive) continue;
      const col = br.bomb ? "#f59e0b" : PALETTE[br.row % PALETTE.length];
      g.save();
      g.fillStyle = col;
      g.globalAlpha = br.hp < br.max ? 0.55 : 0.92;
      roundRect(g, br.x, br.y, br.w, br.h, 4);
      g.fill();
      g.globalAlpha = 1;
      if (br.hp > 1) {
        g.fillStyle = "rgba(0,0,0,0.28)";
        roundRect(g, br.x + 2, br.y + br.h - 4, br.w - 4, 2, 1);
        g.fill();
      }
      if (br.flash > 0) {
        g.globalAlpha = br.flash;
        g.fillStyle = "#fff";
        roundRect(g, br.x, br.y, br.w, br.h, 4);
        g.fill();
      }
      if (br.bomb) {
        g.fillStyle = "#3b1d10";
        g.font = "700 9px ui-monospace, monospace";
        g.textAlign = "center";
        g.fillText("✸", br.x + br.w / 2, br.y + br.h / 2 + 3);
      }
      g.restore();
      br.flash = Math.max(0, br.flash - 0.06);
    }

    // power-up
    for (const d of drops) {
      g.save();
      g.translate(d.x, d.y);
      g.shadowBlur = 10;
      g.shadowColor = d.color;
      g.fillStyle = "rgba(10,14,26,0.92)";
      roundRect(g, -8, -8, 16, 16, 4);
      g.fill();
      g.strokeStyle = d.color;
      g.lineWidth = 1.6;
      g.stroke();
      g.fillStyle = d.color;
      g.font = "700 10px ui-monospace, monospace";
      g.textAlign = "center";
      g.fillText(d.label, 0, 3.5);
      g.restore();
    }

    // bola + jejak
    for (const b of balls) {
      for (let i = 0; i < b.trail.length; i++) {
        const tr = b.trail[i];
        g.globalAlpha = (i / b.trail.length) * 0.28;
        g.fillStyle = "#4ee1ff";
        g.beginPath();
        g.arc(tr.x, tr.y, b.r * 0.8, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      g.shadowBlur = 12;
      g.shadowColor = "#4ee1ff";
      g.fillStyle = "#e7fbff";
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      g.shadowBlur = 0;
    }

    // paddle
    g.fillStyle = "#4ee1ff";
    g.shadowBlur = 12;
    g.shadowColor = "#4ee1ff";
    roundRect(g, paddle.x - paddle.w / 2, H - 44, paddle.w, 9, 4);
    g.fill();
    g.shadowBlur = 0;

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
    g.fillStyle = "rgba(231,236,247,0.9)";
    g.font = "700 11px ui-monospace, monospace";
    g.textAlign = "left";
    g.fillText(`LV ${level}`, 12, 22);
    for (let i = 0; i < lives; i++) {
      g.fillStyle = "#fb7185";
      g.beginPath();
      g.arc(W - 16 - i * 14, 18, 4.4, 0, Math.PI * 2);
      g.fill();
    }
    if (!launched && !over) {
      g.fillStyle = "rgba(231,236,247,0.75)";
      g.textAlign = "center";
      g.font = "600 11px ui-sans-serif, system-ui";
      g.fillText("Tap / spasi untuk lempar bola", W / 2, H - 62);
    }
    g.textAlign = "left";
    g.restore();
  }

  reset(true);
  st.loop((dt) => {
    update(dt);
    render();
  });

  return { destroy: st.destroy };
}
