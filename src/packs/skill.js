// Pack skill: basket, golf, dart, panah, hoki, bowling, meriam, menara, buah, pinball.
import { createStage, clamp, rand, randInt, pick, sfx, roundRect } from "../lib/kit.js";

const W = 320, H = 400;

/* ------------------------------- BASKETBALL ------------------------------ */
function basketball(ctx) {
  const st = createStage(ctx.root, { title: "🏀 Basketball Shot", subtitle: "Atur tenaga, masuk ke ring", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  let ball, hoop, shots, score, power, pdir, flying, over, last;

  function reset() {
    ball = { x: 56, y: 342, vx: 0, vy: 0 };
    hoop = { x: 236, y: 126, dir: 1 };
    shots = 8;
    score = 0;
    power = 0.2;
    pdir = 1;
    flying = false;
    over = false;
    last = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap(() => {
    if (over || flying || shots <= 0) return;
    flying = true;
    ball.vx = 80 + power * 165;
    ball.vy = -(255 + power * 145);
    sfx("click");
  });

  const settle = (made) => {
    flying = false;
    shots--;
    if (made) {
      score += 2;
      last = 2;
      sfx("win");
    } else {
      last = 0;
      sfx("tick");
    }
    st.setScore(score);
    ball.x = 56;
    ball.y = 342;
    ball.vx = 0;
    ball.vy = 0;
    hoop.x = randInt(190, 268);
    if (shots <= 0) {
      over = true;
      st.end({ score, title: "Selesai!", sub: `${score} poin dari 8 tembakan`, retry: reset });
    }
  };

  st.loop((dt) => {
    if (!over) {
      power += pdir * dt * 0.85;
      if (power > 1) {
        power = 1;
        pdir = -1;
      }
      if (power < 0.08) {
        power = 0.08;
        pdir = 1;
      }
      hoop.y += hoop.dir * 26 * dt;
      if (hoop.y > 200 || hoop.y < 92) hoop.dir *= -1;
      if (flying) {
        ball.vy += 430 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.vy > 0 && Math.abs(ball.x - hoop.x) < 26 && ball.y > hoop.y - 6 && ball.y < hoop.y + 16) return settle(true);
        if (ball.y > H + 20 || ball.x > W + 20) return settle(false);
      }
    }
    g.fillStyle = "#101a2c";
    g.fillRect(0, 0, W, H);
    // garis lapangan
    g.strokeStyle = "rgba(255,255,255,0.08)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(W / 2, H + 40, 120, Math.PI, Math.PI * 2);
    g.stroke();
    // ring
    g.strokeStyle = "#ff8a3d";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(hoop.x - 24, hoop.y);
    g.lineTo(hoop.x + 24, hoop.y);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.lineWidth = 2;
    for (let i = -20; i <= 20; i += 8) {
      g.beginPath();
      g.moveTo(hoop.x + i, hoop.y);
      g.lineTo(hoop.x + i * 0.7, hoop.y + 18);
      g.stroke();
    }
    g.fillStyle = "#cbd5e1";
    g.fillRect(hoop.x + 26, hoop.y - 34, 5, 52);
    // bola
    g.fillStyle = "#e8792b";
    g.beginPath();
    g.arc(ball.x, ball.y, 11, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(80,30,0,0.7)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(ball.x - 11, ball.y);
    g.lineTo(ball.x + 11, ball.y);
    g.moveTo(ball.x, ball.y - 11);
    g.lineTo(ball.x, ball.y + 11);
    g.stroke();
    // power
    g.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(g, 22, 150, 12, 180, 6);
    g.fill();
    g.fillStyle = power > 0.8 ? "#fb7185" : "#4ee1ff";
    roundRect(g, 22, 330 - power * 180, 12, power * 180, 6);
    g.fill();
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 12px ui-monospace, monospace";
    g.fillText(`TEMBAKAN ${shots}`, W / 2, 28);
    g.fillText(`SKOR ${score}`, W / 2, 48);
    if (last) g.fillText("+2", hoop.x, hoop.y - 28);
    g.fillStyle = "rgba(231,236,247,0.6)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("ketuk saat tenaga pas", W / 2, H - 14);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* -------------------------------- MINI GOLF ------------------------------ */
function miniGolf(ctx) {
  const st = createStage(ctx.root, { title: "⛳ Mini Golf", subtitle: "Seret dari bola lalu lepas", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  const HOLES = [
    { x: 236, y: 108 },
    { x: 86, y: 120 },
    { x: 168, y: 92 },
  ];
  let ball, vx, vy, strokes, level, drag, moving, over, resting;

  function startHole() {
    ball = { x: W / 2, y: H - 64 };
    vx = 0;
    vy = 0;
    drag = null;
    moving = false;
    resting = true;
  }

  function reset() {
    strokes = 0;
    level = 0;
    over = false;
    startHole();
    st.hideOverlay();
    st.setScore(0);
  }

  st.onPointer((p, type) => {
    if (over) return;
    if (type === "down") drag = { x: p.x, y: p.y };
    else if (type === "move" && drag) {
      drag.x = p.x;
      drag.y = p.y;
    } else if (type === "up" && drag) {
      const dx = drag.x - ball.x, dy = drag.y - ball.y;
      const d = Math.hypot(dx, dy);
      if (resting && d > 8) {
        const sp = Math.min(520, d * 2.1);
        vx = (dx / d) * sp;
        vy = (dy / d) * sp;
        strokes++;
        resting = false;
        moving = true;
        sfx("click");
      }
      drag = null;
    }
  });

  st.loop((dt) => {
    if (!over && moving) {
      const fr = Math.max(0, 1 - 1.5 * dt);
      vx *= fr;
      vy *= fr;
      ball.x += vx * dt;
      ball.y += vy * dt;
      const m = 26;
      const wall = 30;
      if (ball.x < m + wall) {
        ball.x = m + wall;
        vx = Math.abs(vx) * 0.75;
      }
      if (ball.x > W - m - wall) {
        ball.x = W - m - wall;
        vx = -Math.abs(vx) * 0.75;
      }
      if (ball.y < 56) {
        ball.y = 56;
        vy = Math.abs(vy) * 0.75;
      }
      if (ball.y > H - 40) {
        ball.y = H - 40;
        vy = -Math.abs(vy) * 0.75;
      }
      if (Math.hypot(ball.x - HOLES[level].x, ball.y - HOLES[level].y) < 15) {
        sfx("win");
        level++;
        if (level >= HOLES.length) {
          over = true;
          st.end({ score: strokes, title: "Selesai!", sub: `${strokes} pukulan untuk 3 hole`, retry: reset });
          return;
        }
        startHole();
      } else if (Math.hypot(vx, vy) < 9) {
        vx = 0;
        vy = 0;
        moving = false;
        resting = true;
        if (strokes >= 8) {
          level++;
          if (level >= HOLES.length) {
            over = true;
            st.end({ score: strokes, title: "Selesai!", sub: `${strokes} pukulan`, retry: reset });
            return;
          }
          startHole();
        }
      }
    }
    g.fillStyle = "#0f2a1d";
    g.fillRect(0, 0, W, H);
    // green
    g.fillStyle = "#1b452d";
    roundRect(g, 54, 50, W - 108, H - 96, 18);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.15)";
    g.lineWidth = 2;
    g.stroke();
    // hole
    const ho = HOLES[level];
    g.fillStyle = "#05080f";
    g.beginPath();
    g.arc(ho.x, ho.y, 14, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#d1fae5";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "#d1fae5";
    g.fillRect(ho.x - 1, ho.y - 32, 2, 22);
    g.fillStyle = "#f87171";
    g.beginPath();
    g.moveTo(ho.x + 1, ho.y - 32);
    g.lineTo(ho.x + 20, ho.y - 26);
    g.lineTo(ho.x + 1, ho.y - 20);
    g.fill();
    // aim
    if (drag) {
      g.strokeStyle = "rgba(255,209,102,0.7)";
      g.setLineDash([4, 4]);
      g.beginPath();
      g.moveTo(ball.x, ball.y);
      g.lineTo(drag.x, drag.y);
      g.stroke();
      g.setLineDash([]);
    }
    // ball
    g.fillStyle = "#f8fafc";
    g.beginPath();
    g.arc(ball.x, ball.y, 7, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 12px ui-monospace, monospace";
    g.fillText(`HOLE ${level + 1}/3 · PUKULAN ${strokes}`, W / 2, 34);
    g.fillStyle = "rgba(231,236,247,0.6)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("seret dari bola ke arah tujuan", W / 2, H - 14);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* ---------------------------------- DARTS -------------------------------- */
function darts(ctx) {
  const st = createStage(ctx.root, { title: "🎯 Darts", subtitle: "5 lemparan ke papan", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  let darts, score, over, last, flashT;
  const cx = W / 2, cy = 176;

  function reset() {
    darts = 5;
    score = 0;
    over = false;
    last = 0;
    flashT = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap((p) => {
    if (over || darts <= 0) return;
    const d = Math.hypot(p.x - cx, p.y - cy);
    let pts = 0;
    if (d < 12) pts = 50;
    else if (d < 30) pts = 25;
    else if (d < 55) pts = 20;
    else if (d < 78) pts = 15;
    else if (d < 100) pts = 10;
    else if (d < 118) pts = 5;
    score += pts;
    last = pts;
    darts--;
    flashT = 0.4;
    sfx(pts >= 25 ? "win" : pts ? "point" : "tick");
    st.setScore(score);
    if (darts <= 0) {
      over = true;
      st.end({ score, title: "Selesai!", sub: `${score} poin dari 5 lemparan`, retry: reset });
    }
  });

  st.loop((dt) => {
    flashT = Math.max(0, flashT - dt);
    g.fillStyle = "#0d1220";
    g.fillRect(0, 0, W, H);
    const rings = [
      [118, "#1f2937"],
      [100, "#dc2626"],
      [78, "#111827"],
      [55, "#dc2626"],
      [30, "#111827"],
      [12, "#22c55e"],
    ];
    for (const [r, c] of rings) {
      g.fillStyle = c;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
      g.lineTo(cx + Math.cos(a) * 118, cy + Math.sin(a) * 118);
      g.stroke();
    }
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 13px ui-monospace, monospace";
    g.fillText(`SKOR ${score}`, W / 2, 26);
    g.fillText(`LEMBARAN ${darts}`, W / 2, 46);
    if (flashT > 0 && last) {
      g.fillStyle = last >= 50 ? "#ffd166" : "#a3e635";
      g.font = "800 26px ui-monospace, monospace";
      g.fillText(`+${last}`, W / 2, 300);
    }
    g.fillStyle = "rgba(231,236,247,0.6)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("ketuk papan untuk melempar", W / 2, H - 14);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* --------------------------------- ARCHERY ------------------------------- */
function archery(ctx) {
  const st = createStage(ctx.root, { title: "🏹 Archery", subtitle: "Bidik target yang bergerak", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  let arrows, score, over, target, last, flashT;

  function reset() {
    arrows = 8;
    score = 0;
    over = false;
    target = { y: 180, dir: 1, x: 268 };
    last = 0;
    flashT = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap((p) => {
    if (over || arrows <= 0) return;
    const y = clamp(p.y, 60, H - 40);
    const d = Math.abs(y - target.y);
    const pts = d < 12 ? 20 : d < 26 ? 10 : d < 44 ? 5 : 0;
    score += pts;
    last = pts;
    arrows--;
    flashT = 0.5;
    sfx(pts >= 20 ? "win" : pts ? "point" : "tick");
    st.setScore(score);
    if (arrows <= 0) {
      over = true;
      st.end({ score, title: "Selesai!", sub: `${score} poin dari 8 panah`, retry: reset });
    }
  });

  st.loop((dt) => {
    if (!over) {
      target.y += target.dir * 92 * dt;
      if (target.y > H - 80 || target.y < 90) target.dir *= -1;
    }
    flashT = Math.max(0, flashT - dt);
    g.fillStyle = "#102a43";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 18; i++) g.fillRect((i * 53) % W, ((i * 71) % H), 2, 2);
    // busur
    g.strokeStyle = "#f59e0b";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(38, H / 2, 34, -1.1, 1.1);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.5)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(52, H / 2 - 30);
    g.lineTo(52, H / 2 + 30);
    g.stroke();
    // target
    const tx = target.x, ty = target.y;
    for (const [r, c] of [[44, "#e5e7eb"], [34, "#ef4444"], [24, "#f8fafc"], [14, "#ef4444"], [6, "#fbbf24"]]) {
      g.fillStyle = c;
      g.beginPath();
      g.arc(tx, ty, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 13px ui-monospace, monospace";
    g.fillText(`SKOR ${score}`, W / 2, 26);
    g.fillText(`PANAH ${arrows}`, W / 2, 46);
    if (flashT > 0) {
      g.fillStyle = last ? "#a3e635" : "#fb7185";
      g.font = "800 24px ui-monospace, monospace";
      g.fillText(last ? `+${last}` : "MISS", W / 2, 300);
    }
    g.fillStyle = "rgba(231,236,247,0.6)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("ketuk setinggi target", W / 2, H - 14);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* -------------------------------- AIR HOCKEY ----------------------------- */
function airHockey(ctx) {
  const st = createStage(ctx.root, { title: "🏒 Air Hockey", subtitle: "Kalahkan AI sampai 7 gol", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  let puck, py, aiY, pg, ag, over, cooldown, overT;

  function resetPuck() {
    puck = { x: W / 2, y: H / 2, vx: rand(-90, 90) || 80, vy: rand(-70, 70) };
    cooldown = 0.7;
  }

  function reset() {
    py = H / 2;
    aiY = H / 2;
    pg = 0;
    ag = 0;
    over = false;
    overT = 0;
    resetPuck();
    st.hideOverlay();
    st.setScore(0);
  }

  st.onPointer((p) => {
    py = clamp(p.y, 46, H - 46);
  });

  st.loop((dt) => {
    if (!over) {
      cooldown = Math.max(0, cooldown - dt);
      puck.x += puck.vx * dt;
      puck.y += puck.vy * dt;
      // dinding atas bawah
      if (puck.y < 20) {
        puck.y = 20;
        puck.vy = Math.abs(puck.vy) * 0.9;
      }
      if (puck.y > H - 20) {
        puck.y = H - 20;
        puck.vy = -Math.abs(puck.vy) * 0.9;
      }
      // AI mengejar
      const chase = clamp(puck.y, 46, H - 46);
      aiY += clamp(chase - aiY, -190 * dt, 190 * dt);
      // tabrakan paddle
      const hit = (px, side) => {
        const d = Math.hypot(puck.x - px, puck.y - py);
        if (d < 32 && cooldown <= 0) {
          const nx = (puck.x - px) / (d || 1);
          const ny = (puck.y - py) / (d || 1);
          const sp = clamp(Math.hypot(puck.vx, puck.vy) * 1.06, 210, 520);
          puck.vx = side * Math.max(120, Math.abs(nx) * sp);
          puck.vy = ny * sp;
          sfx("hit");
        }
      };
      hit(42, 1);
      const d = Math.hypot(puck.x - (W - 42), puck.y - aiY);
      if (d < 32 && cooldown <= 0) {
        const nx = (puck.x - (W - 42)) / (d || 1);
        const ny = (puck.y - aiY) / (d || 1);
        const sp = clamp(Math.hypot(puck.vx, puck.vy) * 1.02, 200, 500);
        puck.vx = -Math.max(110, Math.abs(nx) * sp);
        puck.vy = ny * sp;
        sfx("hit");
      }
      // gol
      if (puck.x < 10) {
        if (Math.abs(puck.y - H / 2) < 58) {
          ag++;
          sfx("over");
          resetPuck();
        } else {
          puck.x = 14;
          puck.vx = Math.abs(puck.vx);
        }
      }
      if (puck.x > W - 10) {
        if (Math.abs(puck.y - H / 2) < 58) {
          pg++;
          st.setScore(pg);
          sfx("win");
          resetPuck();
        } else {
          puck.x = W - 14;
          puck.vx = -Math.abs(puck.vx);
        }
      }
      if (pg >= 7 || ag >= 7) {
        over = true;
        st.end({ score: pg, title: pg >= 7 ? "Menang! 🎉" : "Kalah", sub: `${pg} – ${ag}`, retry: reset });
      }
    }
    // gambar
    g.fillStyle = "#0b1a2b";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(255,255,255,0.18)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(W / 2, 20);
    g.lineTo(W / 2, H - 20);
    g.stroke();
    g.beginPath();
    g.arc(W / 2, H / 2, 54, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "rgba(78,225,255,0.25)";
    g.fillRect(8, H / 2 - 58, 10, 116);
    g.fillStyle = "rgba(251,113,133,0.25)";
    g.fillRect(W - 18, H / 2 - 58, 10, 116);
    // paddle
    g.fillStyle = "#4ee1ff";
    g.beginPath();
    g.arc(42, py, 20, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fb7185";
    g.beginPath();
    g.arc(W - 42, aiY, 20, 0, Math.PI * 2);
    g.fill();
    // puck
    g.fillStyle = "#f8fafc";
    g.beginPath();
    g.arc(puck.x, puck.y, 11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 16px ui-monospace, monospace";
    g.fillText(`${pg}  :  ${ag}`, W / 2, 40);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* --------------------------------- BOWLING ------------------------------- */
function bowling(ctx) {
  const st = createStage(ctx.root, { title: "🎳 Bowling", subtitle: "Ketuk jalur untuk mengarahkan bola", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  let pins, rolls, frame, score, busy, ball, over, targetX;

  const makePins = () => {
    const out = [];
    for (let r = 0; r < 4; r++) {
      const count = 4 - r;
      for (let i = 0; i < count; i++) out.push({ x: W / 2 + (i - (count - 1) / 2) * 30, y: 74 + r * 26, down: false });
    }
    return out;
  };

  function reset() {
    pins = makePins();
    rolls = 0;
    frame = 1;
    score = 0;
    busy = false;
    ball = null;
    over = false;
    targetX = W / 2;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap((p) => {
    if (over || busy) return;
    targetX = clamp(p.x, 40, W - 40);
    busy = true;
    ball = { x: W / 2, y: H - 30, t: 0, tx: targetX };
    sfx("click");
  });

  const finishRoll = () => {
    let knocked = 0;
    for (const p of pins) {
      if (!p.down && Math.abs(p.x - targetX) < 34) {
        p.down = true;
        knocked++;
      }
    }
    score += knocked;
    rolls++;
    st.setScore(score);
    sfx(knocked ? "point" : "tick");
    ball = null;
    busy = false;
    const allDown = pins.every((p) => p.down);
    if (allDown || rolls >= 2) {
      frame++;
      rolls = 0;
      pins = makePins();
      if (frame > 3) {
        over = true;
        st.end({ score, title: "Selesai!", sub: `${score} pin dari 3 frame`, retry: reset });
      }
    }
  };

  st.loop((dt) => {
    if (ball) {
      ball.t += dt / 0.6;
      ball.x += (ball.tx - ball.x) * Math.min(1, dt * 8);
      ball.y -= 460 * dt;
      if (ball.t >= 1 || ball.y < 90) finishRoll();
    }
    g.fillStyle = "#12200f";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#3b2410";
    roundRect(g, 26, 50, W - 52, H - 80, 16);
    g.fill();
    g.fillStyle = "#5a3a1c";
    roundRect(g, 44, 60, W - 88, H - 110, 12);
    g.fill();
    // pin
    for (const p of pins) {
      if (p.down) continue;
      g.fillStyle = "#f8fafc";
      g.beginPath();
      g.arc(p.x, p.y, 7, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ef4444";
      g.fillRect(p.x - 5, p.y - 7, 10, 3);
    }
    if (ball) {
      g.fillStyle = "#38bdf8";
      g.beginPath();
      g.arc(ball.x, ball.y, 12, 0, Math.PI * 2);
      g.fill();
    } else {
      g.strokeStyle = "rgba(255,209,102,0.6)";
      g.setLineDash([4, 5]);
      g.beginPath();
      g.moveTo(W / 2, H - 34);
      g.lineTo(targetX, 96);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = "#38bdf8";
      g.beginPath();
      g.arc(W / 2, H - 34, 12, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 12px ui-monospace, monospace";
    g.fillText(`FRAME ${frame}/3 · ROLL ${rolls + 1}`, W / 2, 28);
    g.fillText(`SKOR ${score}`, W / 2, H - 16);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* ------------------------------- CANNON SHOT ----------------------------- */
function cannonShot(ctx) {
  const st = createStage(ctx.root, { title: "💥 Cannon Shot", subtitle: "Atur tenaga, hancurkan blok", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  let blocks, ball, shots, score, power, pdir, flying, over;

  function reset() {
    blocks = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) blocks.push({ x: 196 + c * 30, y: 132 + r * 22, w: 26, h: 18 });
    ball = { x: 54, y: 334, vx: 0, vy: 0 };
    shots = 8;
    score = 0;
    power = 0.2;
    pdir = 1;
    flying = false;
    over = false;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap(() => {
    if (over || flying || shots <= 0) return;
    flying = true;
    ball.vx = 130 + power * 190;
    ball.vy = -(300 + power * 110);
    sfx("click");
  });

  const settle = () => {
    flying = false;
    shots--;
    ball.x = 54;
    ball.y = 334;
    ball.vx = 0;
    ball.vy = 0;
    if (shots <= 0) {
      over = true;
      st.end({ score, title: "Selesai!", sub: `${score} blok hancur`, retry: reset });
    }
  };

  st.loop((dt) => {
    if (!over) {
      power += pdir * dt * 0.9;
      if (power > 1) {
        power = 1;
        pdir = -1;
      }
      if (power < 0.08) {
        power = 0.08;
        pdir = 1;
      }
      if (flying) {
        ball.vy += 420 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        for (let i = 0; i < blocks.length; i++) {
          const b = blocks[i];
          if (ball.x > b.x - 5 && ball.x < b.x + b.w + 5 && ball.y > b.y - 5 && ball.y < b.y + b.h + 5) {
            blocks.splice(i, 1);
            score += 10;
            st.setScore(score);
            sfx("hit");
            settle();
            return;
          }
        }
        if (ball.y > H + 30 || ball.x > W + 30) return settle();
      }
    }
    g.fillStyle = "#1a1020";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#241528";
    g.fillRect(0, 352, W, 48);
    // meriam
    g.save();
    g.translate(54, 334);
    g.rotate(-0.75);
    g.fillStyle = "#64748b";
    roundRect(g, 0, -10, 48, 20, 8);
    g.fill();
    g.restore();
    g.fillStyle = "#334155";
    g.beginPath();
    g.arc(54, 334, 16, 0, Math.PI * 2);
    g.fill();
    // blok
    for (const b of blocks) {
      g.fillStyle = "#8b5cf6";
      roundRect(g, b.x, b.y, b.w, b.h, 4);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.25)";
      g.fillRect(b.x + 3, b.y + 3, b.w - 6, 3);
    }
    if (flying) {
      g.fillStyle = "#fbbf24";
      g.beginPath();
      g.arc(ball.x, ball.y, 6, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "rgba(255,255,255,0.15)";
    roundRect(g, 20, 150, 12, 170, 6);
    g.fill();
    g.fillStyle = power > 0.8 ? "#fb7185" : "#fbbf24";
    roundRect(g, 20, 320 - power * 170, 12, power * 170, 6);
    g.fill();
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 12px ui-monospace, monospace";
    g.fillText(`PELURU ${shots} · SKOR ${score}`, W / 2, 26);
    g.fillStyle = "rgba(231,236,247,0.6)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("ketuk saat tenaga pas", W / 2, H - 12);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* -------------------------------- STACK TOWER ---------------------------- */
function stackTower(ctx) {
  const st = createStage(ctx.root, { title: "🏗️ Stack Tower", subtitle: "Tumpuk tepat di atas blok", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  let stack, cur, dir, speed, over, offsetY;

  function reset() {
    stack = [{ x: W / 2 - 45, w: 90 }];
    cur = { x: 30, w: 90 };
    dir = 1;
    speed = 90;
    over = false;
    offsetY = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap(() => {
    if (over) return;
    const top = stack[stack.length - 1];
    const left = Math.max(top.x, cur.x);
    const right = Math.min(top.x + top.w, cur.x + cur.w);
    const overlap = right - left;
    if (overlap <= 4) {
      over = true;
      sfx("over");
      st.end({ score: stack.length - 1, title: "Menara roboh!", sub: `${stack.length - 1} lantai`, retry: reset });
      return;
    }
    stack.push({ x: left, w: overlap });
    sfx("point");
    st.setScore(stack.length - 1);
    cur = { x: 30, w: overlap };
    dir = Math.random() < 0.5 ? 1 : -1;
    speed = Math.min(230, 90 + stack.length * 7);
  });

  st.loop((dt) => {
    if (!over) {
      cur.x += dir * speed * dt;
      if (cur.x + cur.w > W - 24) {
        cur.x = W - 24 - cur.w;
        dir = -1;
      }
      if (cur.x < 24) {
        cur.x = 24;
        dir = 1;
      }
    }
    g.fillStyle = "#0b1220";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 20; i++) g.fillRect((i * 71) % W, ((i * 37) % H), 2, 2);
    const baseY = H - 46;
    const shown = Math.min(stack.length, 14);
    offsetY = Math.max(0, stack.length - 14) * 24;
    for (let i = 0; i < shown; i++) {
      const idx = stack.length - shown + i;
      const b = stack[idx];
      const y = baseY - i * 24;
      const hue = 190 + ((idx * 17) % 140);
      g.fillStyle = `hsl(${hue} 70% 52%)`;
      roundRect(g, b.x, y, b.w, 20, 5);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.fillRect(b.x + 4, y + 3, Math.max(2, b.w - 8), 3);
    }
    if (!over) {
      const y = baseY - stack.length * 24;
      g.fillStyle = "#ffd166";
      roundRect(g, cur.x, y, cur.w, 20, 5);
      g.fill();
    }
    // tanah
    g.fillStyle = "#1e293b";
    g.fillRect(0, H - 24, W, 24);
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 13px ui-monospace, monospace";
    g.fillText(`LANTAI ${stack.length - 1}`, W / 2, 30);
    g.fillStyle = "rgba(231,236,247,0.6)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("ketuk untuk menjatuhkan blok", W / 2, 50);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* -------------------------------- FRUIT SLICE ---------------------------- */
function fruitSlice(ctx) {
  const st = createStage(ctx.root, { title: "🍉 Fruit Slice", subtitle: "Potong buah, hindari bom", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  const FRUITS = [
    ["🍉", "#ef4444"],
    ["🍎", "#f97316"],
    ["🍊", "#f59e0b"],
    ["🍋", "#facc15"],
    ["🍇", "#a855f7"],
    ["🥝", "#22c55e"],
  ];
  let items, spawnT, score, lives, combo, over, slicing, last, trail;

  function reset() {
    items = [];
    spawnT = 0.4;
    score = 0;
    lives = 3;
    combo = 0;
    over = false;
    slicing = false;
    last = 0;
    trail = [];
    st.hideOverlay();
    st.setScore(0);
  }

  const segDist = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  };

  st.onPointer((p, type) => {
    if (over) return;
    if (type === "down") {
      slicing = true;
      last = { x: p.x, y: p.y };
      trail = [{ x: p.x, y: p.y }];
    } else if (type === "move" && slicing) {
      const prev = last || { x: p.x, y: p.y };
      for (const it of items) {
        if (it.dead) continue;
        if (segDist(it.x, it.y, prev.x, prev.y, p.x, p.y) < it.r + 6) {
          it.dead = true;
          if (it.bomb) {
            over = true;
            sfx("over");
            st.end({ score, title: "Bom meledak!", sub: `Skor ${score}`, retry: reset });
            return;
          }
          combo++;
          score += 5 + Math.min(10, combo);
          st.setScore(score);
          sfx("point");
        }
      }
      last = { x: p.x, y: p.y };
      trail.push(last);
      if (trail.length > 8) trail.shift();
    } else if (type === "up") {
      slicing = false;
      last = null;
      trail = [];
    }
  });

  st.loop((dt) => {
    if (!over) {
      spawnT -= dt;
      if (spawnT <= 0) {
        const bomb = Math.random() < 0.16;
        const [e, c] = pick(FRUITS);
        items.push({
          x: rand(40, W - 40),
          y: H + 20,
          vx: rand(-30, 30),
          vy: -rand(420, 520),
          r: rand(14, 20),
          emoji: bomb ? "💣" : e,
          color: bomb ? "#4b5563" : c,
          bomb,
        });
        spawnT = rand(0.55, 0.95);
      }
      for (const it of items) {
        it.vy += 300 * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        if (!it.dead && !it.bomb && it.y > H + 40) {
          it.dead = true;
          it.missed = true;
        }
      }
      const missed = items.filter((it) => it.missed).length;
      if (missed) {
        lives -= missed;
        combo = 0;
        sfx("tick");
        items = items.filter((it) => !it.missed);
        if (lives <= 0) {
          over = true;
          st.end({ score, title: "Buah lolos!", sub: `Skor ${score}`, retry: reset });
        }
      }
      items = items.filter((it) => !it.dead && it.y < H + 60);
    }
    g.fillStyle = "#1f1205";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 16; i++) g.fillRect((i * 59) % W, ((i * 83) % H), 2, 2);
    if (trail.length > 1) {
      g.strokeStyle = "rgba(255,255,255,0.65)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(trail[0].x, trail[0].y);
      for (const p of trail) g.lineTo(p.x, p.y);
      g.stroke();
    }
    for (const it of items) {
      g.fillStyle = it.color;
      g.globalAlpha = 0.25;
      g.beginPath();
      g.arc(it.x, it.y, it.r + 4, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      g.font = `${Math.round(it.r * 2)}px serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(it.emoji, it.x, it.y);
    }
    g.textBaseline = "alphabetic";
    g.textAlign = "center";
    g.fillStyle = "#e7ecf7";
    g.font = "700 13px ui-monospace, monospace";
    g.fillText(`SKOR ${score}`, W / 2, 26);
    g.fillText("❤️".repeat(Math.max(0, lives)), W / 2, 46);
    g.fillStyle = "rgba(231,236,247,0.6)";
    g.font = "600 10px ui-monospace, monospace";
    g.fillText("geser untuk memotong buah", W / 2, H - 14);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

/* -------------------------------- PINBALL LITE --------------------------- */
function pinballLite(ctx) {
  const st = createStage(ctx.root, { title: "🕹️ Pinball Lite", subtitle: "Ketuk kiri/kanan untuk flipper", best: ctx.best, onBest: ctx.report });
  const g = st.ctx;
  const BUMPERS = [
    { x: 100, y: 130, r: 22 },
    { x: 220, y: 130, r: 22 },
    { x: 160, y: 196, r: 24 },
  ];
  let ball, balls, score, over, kick, cooldown;

  function resetBall() {
    ball = { x: W / 2, y: 70, vx: rand(-40, 40), vy: 30 };
    cooldown = 0.5;
  }

  function reset() {
    balls = 3;
    score = 0;
    over = false;
    kick = 0;
    resetBall();
    st.hideOverlay();
    st.setScore(0);
  }

  st.onTap((p) => {
    if (over || !ball) return;
    kick = 0.18;
    if (p.x < W / 2) {
      if (Math.hypot(ball.x - 104, ball.y - 334) < 74) {
        ball.vy = -430;
        ball.vx += (ball.x - 104) * 2.2 + 40;
        sfx("hit");
      }
    } else if (Math.hypot(ball.x - 216, ball.y - 334) < 74) {
      ball.vy = -430;
      ball.vx += (ball.x - 216) * 2.2 - 40;
      sfx("hit");
    }
  });

  st.loop((dt) => {
    if (!over) {
      kick = Math.max(0, kick - dt);
      cooldown = Math.max(0, cooldown - dt);
      if (ball) {
        ball.vy += 170 * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        if (ball.x < 16) {
          ball.x = 16;
          ball.vx = Math.abs(ball.vx);
        }
        if (ball.x > W - 16) {
          ball.x = W - 16;
          ball.vx = -Math.abs(ball.vx);
        }
        if (ball.y < 40) {
          ball.y = 40;
          ball.vy = Math.abs(ball.vy);
        }
        for (const b of BUMPERS) {
          const d = Math.hypot(ball.x - b.x, ball.y - b.y);
          if (d < b.r + 8 && cooldown <= 0) {
            const nx = (ball.x - b.x) / (d || 1);
            const ny = (ball.y - b.y) / (d || 1);
            const sp = clamp(Math.hypot(ball.vx, ball.vy) * 1.15 + 30, 190, 430);
            ball.vx = nx * sp;
            ball.vy = ny * sp;
            score += 10;
            st.setScore(score);
            cooldown = 0.16;
            sfx("point");
          }
        }
        if (ball.y > H + 20) {
          balls--;
          sfx("over");
          if (balls <= 0) {
            over = true;
            ball = null;
            st.end({ score, title: "Bola habis", sub: `Skor ${score}`, retry: reset });
          } else resetBall();
        }
      }
    }
    g.fillStyle = "#0a0a18";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(120,110,255,0.25)";
    g.lineWidth = 3;
    g.strokeRect(12, 34, W - 24, H - 34);
    for (const b of BUMPERS) {
      g.fillStyle = "#7c3aed";
      g.beginPath();
      g.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#c4b5fd";
      g.lineWidth = 2;
      g.stroke();
      g.fillStyle = "rgba(255,255,255,0.25)";
      g.beginPath();
      g.arc(b.x - 5, b.y - 5, b.r / 2.4, 0, Math.PI * 2);
      g.fill();
    }
    // flipper
    g.strokeStyle = "#4ee1ff";
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(66, 350);
    g.lineTo(132, kick > 0 ? 322 : 342);
    g.stroke();
    g.strokeStyle = "#fb7185";
    g.beginPath();
    g.moveTo(W - 66, 350);
    g.lineTo(W - 132, kick > 0 ? 322 : 342);
    g.stroke();
    if (ball) {
      g.fillStyle = "#f8fafc";
      g.beginPath();
      g.arc(ball.x, ball.y, 9, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#e7ecf7";
    g.textAlign = "center";
    g.font = "700 13px ui-monospace, monospace";
    g.fillText(`SKOR ${score}`, W / 2, 26);
    g.fillText(`BOLA ${balls}`, W / 2, H - 10);
    g.textAlign = "left";
  });

  reset();
  return { destroy: st.destroy };
}

export const skill = [
  { id: "basketball-shot", name: "Basketball", emoji: "🏀", tag: "Skill", desc: "Atur tenaga tembakan ke ring bergerak.", bestMode: "max", mount: basketball },
  { id: "mini-golf", name: "Mini Golf", emoji: "⛳", tag: "Skill", desc: "Seret untuk memukul bola ke hole.", bestMode: "min", mount: miniGolf },
  { id: "darts", name: "Darts", emoji: "🎯", tag: "Skill", desc: "Lempar 5 dart ke papan skor.", bestMode: "max", mount: darts },
  { id: "archery", name: "Archery", emoji: "🏹", tag: "Skill", desc: "Panah target yang naik turun.", bestMode: "max", mount: archery },
  { id: "air-hockey", name: "Air Hockey", emoji: "🏒", tag: "Skill", desc: "Kalahkan AI sampai 7 gol.", bestMode: "max", mount: airHockey },
  { id: "bowling", name: "Bowling", emoji: "🎳", tag: "Skill", desc: "Jatuhkan pin dalam 3 frame.", bestMode: "max", mount: bowling },
  { id: "cannon-shot", name: "Cannon Shot", emoji: "💥", tag: "Skill", desc: "Hancurkan blok dengan meriam.", bestMode: "max", mount: cannonShot },
  { id: "stack-tower", name: "Stack Tower", emoji: "🏗️", tag: "Skill", desc: "Tumpuk blok setinggi mungkin.", bestMode: "max", mount: stackTower },
  { id: "fruit-slice", name: "Fruit Slice", emoji: "🍉", tag: "Skill", desc: "Potong buah, jangan kena bom.", bestMode: "max", mount: fruitSlice },
  { id: "pinball-lite", name: "Pinball Lite", emoji: "🕹️", tag: "Skill", desc: "Pantulkan bola ke bumper untuk skor.", bestMode: "max", mount: pinballLite },
];
