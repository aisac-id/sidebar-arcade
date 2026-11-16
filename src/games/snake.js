import { createStage, COLORS, roundRect, sfx, randInt } from "../lib/kit.js";

const COLS = 16;
const ROWS = 20;
const CELL = 20; // 320 x 400

export default {
  id: "snake",
  name: "Snake",
  emoji: "🐍",
  tag: "Arcade",
  desc: "Makan buah, jangan gigit badan sendiri.",
  bestMode: "max",
  mount(ctx) {
    const st = createStage(ctx.root, {
      w: COLS * CELL,
      h: ROWS * CELL,
      title: "🐍 Snake",
      subtitle: "Panah / WASD · geser di layar",
      best: ctx.best,
      onBest: ctx.report,
    });

    let snake = [];
    let dir = { x: 1, y: 0 };
    let queued = [];
    let food = { x: 12, y: 10 };
    let alive = true;
    let acc = 0;
    let speed = 7;
    let score = 0;

    const freeCell = () => {
      for (let tries = 0; tries < 400; tries++) {
        const p = { x: randInt(0, COLS - 1), y: randInt(0, ROWS - 1) };
        if (!snake.some((s) => s.x === p.x && s.y === p.y)) return p;
      }
      return { x: 0, y: 0 };
    };

    const start = () => {
      snake = [
        { x: 8, y: 10 },
        { x: 7, y: 10 },
        { x: 6, y: 10 },
      ];
      dir = { x: 1, y: 0 };
      queued = [];
      alive = true;
      acc = 0;
      speed = 7;
      score = 0;
      food = freeCell();
      st.setScore(0);
      st.hideOverlay();
    };

    const turn = (name) => {
      const map = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
      const d = map[name];
      if (!d) return;
      const lastDir = queued.length ? queued[queued.length - 1] : dir;
      if (lastDir.x === -d[0] && lastDir.y === -d[1]) return;
      if (lastDir.x === d[0] && lastDir.y === d[1]) return;
      if (queued.length < 3) queued.push({ x: d[0], y: d[1] });
    };

    const die = () => {
      alive = false;
      ctx.report(score);
      st.end({ score, title: "Game Over", sub: `Skor ${score} · panjang ${snake.length}`, retry: start });
    };

    const step = () => {
      if (queued.length) dir = queued.shift();
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) return die();
      if (snake.some((s) => s.x === head.x && s.y === head.y)) return die();

      const ate = head.x === food.x && head.y === food.y;
      snake.unshift(head);
      if (ate) {
        score += 10;
        speed = Math.min(16, 7 + Math.floor(score / 40));
        food = freeCell();
        st.setScore(score);
        sfx("point");
      } else {
        snake.pop();
      }
    };

    const draw = () => {
      const c = st.ctx;
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, st.w, st.h);

      // grid tipis
      c.strokeStyle = COLORS.grid;
      c.lineWidth = 1;
      for (let x = 1; x < COLS; x++) {
        c.beginPath();
        c.moveTo(x * CELL, 0);
        c.lineTo(x * CELL, st.h);
        c.stroke();
      }
      for (let y = 1; y < ROWS; y++) {
        c.beginPath();
        c.moveTo(0, y * CELL);
        c.lineTo(st.w, y * CELL);
        c.stroke();
      }

      // buah
      const fx = food.x * CELL + CELL / 2;
      const fy = food.y * CELL + CELL / 2;
      c.save();
      c.shadowColor = COLORS.pink;
      c.shadowBlur = 14;
      c.fillStyle = COLORS.pink;
      c.beginPath();
      c.arc(fx, fy, CELL * 0.34, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.fillStyle = "rgba(255,255,255,0.75)";
      c.beginPath();
      c.arc(fx - 2.5, fy - 3, 2, 0, Math.PI * 2);
      c.fill();

      // ular
      for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];
        const t = i / Math.max(1, snake.length - 1);
        c.fillStyle = i === 0 ? COLORS.cyan : mix(COLORS.cyan, COLORS.violet, t);
        if (i === 0) {
          c.save();
          c.shadowColor = COLORS.cyan;
          c.shadowBlur = 12;
        }
        roundRect(c, s.x * CELL + 1.5, s.y * CELL + 1.5, CELL - 3, CELL - 3, 5);
        c.fill();
        if (i === 0) c.restore();
      }

      // mata
      const head = snake[0];
      if (head) {
        const cx = head.x * CELL + CELL / 2;
        const cy = head.y * CELL + CELL / 2;
        const ox = dir.y !== 0 ? 4 : 0;
        const oy = dir.x !== 0 ? 4 : 0;
        c.fillStyle = "#08111f";
        c.beginPath();
        c.arc(cx - ox * 0.9 + (dir.x > 0 ? 2 : -2), cy - oy * 0.9, 2, 0, 7);
        c.arc(cx + ox * 0.9 + (dir.x > 0 ? 2 : -2), cy + oy * 0.9, 2, 0, 7);
        c.fill();
      }
    };

    st.onKeyDown((k) => {
      if (!alive) {
        if (k === "space" || k === "enter") start();
        return;
      }
      turn(k);
    });
    st.onSwipe((d) => alive && turn(d));
    st.pad(["left", "up", "down", "right"]);

    st.loop((dt) => {
      if (alive) {
        acc += dt * speed;
        while (acc >= 1 && alive) {
          acc -= 1;
          step();
        }
      }
      draw();
    });

    start();
    return { destroy: st.destroy };
  },
};

function mix(a, b, t) {
  const pa = hex(a);
  const pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hex(h) {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
