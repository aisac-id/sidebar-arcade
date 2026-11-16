import { createStage, COLORS, roundRect, sfx, clamp } from "../lib/kit.js";

const W = 320;
const H = 400;

export default {
  id: "pong",
  name: "Pong",
  emoji: "🏓",
  tag: "Arcade",
  desc: "Jaga bola tetap hidup, kumpulkan rally.",
  bestMode: "max",
  mount(ctx) {
    const st = createStage(ctx.root, {
      w: W,
      h: H,
      title: "🏓 Pong",
      subtitle: "Paddle bawah = kamu · panah / sentuh",
      best: ctx.best,
      onBest: ctx.report,
    });

    let player, cpu, ball, rally, alive, started;

    const start = () => {
      player = { x: W / 2 - 32, y: H - 26, w: 64, h: 9 };
      cpu = { x: W / 2 - 32, y: 17, w: 64, h: 9 };
      rally = 0;
      alive = true;
      started = false;
      ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 6 };
      st.setScore(0);
      st.hideOverlay();
    };

    const serve = () => {
      started = true;
      const dir = Math.random() < 0.5 ? -1 : 1;
      ball.vx = 120 * dir;
      ball.vy = -230;
    };

    const miss = () => {
      alive = false;
      sfx("hit");
      ctx.report(rally);
      st.end({ score: rally, title: "Bola lolos", sub: `Rally ${rally}x`, retry: start });
    };

    const moveTo = (clientX) => {
      const rect = st.canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      player.x = clamp(x - player.w / 2, 6, W - player.w - 6);
    };
    st.canvas.addEventListener("pointermove", (e) => alive && moveTo(e.clientX));
    st.canvas.addEventListener("pointerdown", (e) => {
      if (!alive) return;
      moveTo(e.clientX);
      if (!started) serve();
    });
    st.onKeyDown((k) => {
      if (!alive) {
        if (k === "space" || k === "enter") start();
        return;
      }
      if (!started && (k === "space" || k === "enter")) serve();
    });

    st.loop((dt) => {
      if (alive) {
        const sp = 300 * dt;
        if (st.isDown("left")) player.x = clamp(player.x - sp, 6, W - player.w - 6);
        if (st.isDown("right")) player.x = clamp(player.x + sp, 6, W - player.w - 6);

        if (!started) {
          ball.x = player.x + player.w / 2;
          ball.y = player.y - 14;
        } else {
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
          // kalau CPU gagal menghalau, bola memantul di langit-langit
          if (ball.y < ball.r) {
            ball.y = ball.r;
            ball.vy = Math.abs(ball.vy);
          }

          // paddle player
          if (
            ball.vy > 0 &&
            ball.y + ball.r >= player.y &&
            ball.y - ball.r <= player.y + player.h &&
            ball.x >= player.x - 4 &&
            ball.x <= player.x + player.w + 4
          ) {
            const hit = clamp((ball.x - (player.x + player.w / 2)) / (player.w / 2), -1, 1);
            const speed = Math.min(480, Math.hypot(ball.vx, ball.vy) * 1.06);
            const angle = hit * 0.9;
            ball.vx = Math.sin(angle) * speed;
            ball.vy = -Math.abs(Math.cos(angle) * speed);
            ball.y = player.y - ball.r - 0.5;
            rally++;
            st.setScore(rally);
            sfx("tick");
          }

          // paddle cpu
          if (ball.vy < 0 && ball.y - ball.r <= cpu.y + cpu.h && ball.y + ball.r >= cpu.y) {
            if (ball.x > cpu.x - 4 && ball.x < cpu.x + cpu.w + 4) {
              const hit = clamp((ball.x - (cpu.x + cpu.w / 2)) / (cpu.w / 2), -1, 1);
              const speed = Math.min(480, Math.hypot(ball.vx, ball.vy) * 1.04);
              const angle = hit * 0.85;
              ball.vx = Math.sin(angle) * speed;
              ball.vy = Math.abs(Math.cos(angle) * speed);
              ball.y = cpu.y + cpu.h + ball.r + 0.5;
            }
          }

          if (ball.y - ball.r > H + 10) miss();

          // ai
          const aim = ball.vy < 0 ? ball.x : W / 2 + Math.sin(performance.now() / 700) * 60;
          const maxSpeed = 150 + rally * 8;
          const dx = aim - (cpu.x + cpu.w / 2);
          cpu.x = clamp(cpu.x + clamp(dx, -maxSpeed * dt, maxSpeed * dt), 6, W - cpu.w - 6);
        }
      }

      const c = st.ctx;
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, W, H);

      // net
      c.strokeStyle = "rgba(120,160,255,0.16)";
      c.lineWidth = 2;
      c.setLineDash([7, 9]);
      c.beginPath();
      c.moveTo(0, H / 2);
      c.lineTo(W, H / 2);
      c.stroke();
      c.setLineDash([]);

      c.fillStyle = COLORS.cyan;
      roundRect(c, cpu.x, cpu.y, cpu.w, cpu.h, 5);
      c.fill();

      c.fillStyle = COLORS.pink;
      roundRect(c, player.x, player.y, player.w, player.h, 5);
      c.fill();

      c.save();
      c.shadowColor = COLORS.violet;
      c.shadowBlur = 16;
      c.fillStyle = "#e9e7ff";
      c.beginPath();
      c.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      c.fill();
      c.restore();

      if (!started) {
        c.fillStyle = COLORS.dim;
        c.font = "12px ui-monospace, monospace";
        c.textAlign = "center";
        c.fillText("klik / spasi untuk servis", W / 2, H / 2 + 34);
        c.textAlign = "start";
      }
    });

    start();
    return { destroy: st.destroy };
  },
};
