import { createStage, COLORS, roundRect, sfx, clamp } from "../lib/kit.js";

const W = 320;
const H = 400;

export default {
  id: "breakout",
  name: "Breakout",
  emoji: "🧨",
  tag: "Arcade",
  desc: "Hancurkan semua bata dengan bola.",
  bestMode: "max",
  mount(ctx) {
    const st = createStage(ctx.root, {
      w: W,
      h: H,
      title: "🧨 Breakout",
      subtitle: "Gerakkan paddle · panah / sentuh",
      best: ctx.best,
      onBest: ctx.report,
    });

    const BCOLS = 6;
    const BROWS = 4;
    const MARGIN = 10;
    const GAP = 4;
    const BRICK_W = (W - MARGIN * 2 - GAP * (BCOLS - 1)) / BCOLS;
    const BRICK_H = 16;
    const TOP = 46;

    let paddle, ball, bricks, lives, score, alive, level;

    const buildBricks = () => {
      bricks = [];
      for (let r = 0; r < BROWS; r++)
        for (let c = 0; c < BCOLS; c++) {
          bricks.push({
            x: MARGIN + c * (BRICK_W + GAP),
            y: TOP + r * (BRICK_H + GAP),
            w: BRICK_W,
            h: BRICK_H,
            hp: 1,
            color: [COLORS.pink, COLORS.violet, COLORS.cyan, COLORS.lime][r % 4],
          });
        }
    };

    const resetBall = () => {
      ball = { x: W / 2, y: H - 90, vx: 130 * (Math.random() < 0.5 ? -1 : 1), vy: -210, r: 5 };
    };

    const start = () => {
      paddle = { x: W / 2 - 32, y: H - 30, w: 64, h: 9 };
      lives = 3;
      score = 0;
      level = 1;
      alive = true;
      buildBricks();
      resetBall();
      st.setScore(0);
      st.hideOverlay();
    };

    const loseLife = () => {
      lives--;
      sfx("hit");
      if (lives <= 0) {
        alive = false;
        ctx.report(score);
        st.end({ score, title: "Game Over", sub: `${score} poin · level ${level}`, retry: start });
        return;
      }
      resetBall();
    };

    const onMove = (clientX) => {
      const rect = st.canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      paddle.x = clamp(x - paddle.w / 2, 0, W - paddle.w);
    };
    st.canvas.addEventListener("pointermove", (e) => alive && onMove(e.clientX));
    st.canvas.addEventListener("pointerdown", (e) => alive && onMove(e.clientX));

    st.onKeyDown((k) => {
      if (!alive && (k === "space" || k === "enter")) start();
    });

    st.loop((dt) => {
      if (alive) {
        const sp = 260 * dt;
        if (st.isDown("left")) paddle.x = clamp(paddle.x - sp, 0, W - paddle.w);
        if (st.isDown("right")) paddle.x = clamp(paddle.x + sp, 0, W - paddle.w);

        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        if (ball.x < ball.r) {
          ball.x = ball.r;
          ball.vx *= -1;
        }
        if (ball.x > W - ball.r) {
          ball.x = W - ball.r;
          ball.vx *= -1;
        }
        if (ball.y < ball.r) {
          ball.y = ball.r;
          ball.vy *= -1;
        }
        if (ball.y > H) loseLife();

        // paddle
        if (
          ball.vy > 0 &&
          ball.y + ball.r >= paddle.y &&
          ball.y - ball.r <= paddle.y + paddle.h &&
          ball.x >= paddle.x &&
          ball.x <= paddle.x + paddle.w
        ) {
          const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
          const speed = Math.min(360, Math.hypot(ball.vx, ball.vy) * 1.03);
          const angle = hit * 1.05;
          ball.vx = Math.sin(angle) * speed;
          ball.vy = -Math.abs(Math.cos(angle) * speed);
          ball.y = paddle.y - ball.r - 0.5;
          sfx("tick");
        }

        // brick
        for (let i = bricks.length - 1; i >= 0; i--) {
          const b = bricks[i];
          if (
            ball.x + ball.r > b.x &&
            ball.x - ball.r < b.x + b.w &&
            ball.y + ball.r > b.y &&
            ball.y - ball.r < b.y + b.h
          ) {
            const overlapX = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
            const overlapY = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
            if (overlapX < overlapY) ball.vx *= -1;
            else ball.vy *= -1;
            bricks.splice(i, 1);
            score += 10;
            st.setScore(score);
            sfx("point");
            break;
          }
        }

        if (!bricks.length) {
          level++;
          score += 50;
          st.setScore(score);
          sfx("win");
          buildBricks();
          resetBall();
        }
      }

      // gambar
      const c = st.ctx;
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, W, H);

      for (const b of bricks) {
        c.fillStyle = b.color;
        c.globalAlpha = 0.9;
        roundRect(c, b.x, b.y, b.w, b.h, 4);
        c.fill();
        c.globalAlpha = 0.25;
        c.fillStyle = "#fff";
        roundRect(c, b.x + 2, b.y + 2, b.w - 4, 3, 2);
        c.fill();
        c.globalAlpha = 1;
      }

      c.fillStyle = COLORS.cyan;
      roundRect(c, paddle.x, paddle.y, paddle.w, paddle.h, 5);
      c.fill();

      c.save();
      c.shadowColor = COLORS.amber;
      c.shadowBlur = 14;
      c.fillStyle = "#fff6d5";
      c.beginPath();
      c.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // nyawa
      for (let i = 0; i < lives; i++) {
        c.fillStyle = COLORS.pink;
        c.beginPath();
        c.arc(14 + i * 14, 20, 4, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = COLORS.dim;
      c.font = "11px ui-monospace, monospace";
      c.fillText("LEVEL " + level, W - 62, 24);
    });

    start();
    return { destroy: st.destroy };
  },
};
