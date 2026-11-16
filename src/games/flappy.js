import { createStage, COLORS, sfx, rand } from "../lib/kit.js";

const W = 320;
const H = 400;
const GROUND = 46;

export default {
  id: "flappy",
  name: "Flappy",
  emoji: "🐤",
  tag: "Arcade",
  desc: "Klik untuk terbang, hindari pipa.",
  bestMode: "max",
  mount(ctx) {
    const st = createStage(ctx.root, {
      w: W,
      h: H,
      title: "🐤 Flappy",
      subtitle: "Klik / sentuh / spasi untuk terbang",
      best: ctx.best,
      onBest: ctx.report,
    });

    let bird, pipes, score, alive, started, spawnAcc, speed, scroll;

    const start = () => {
      bird = { x: 84, y: H / 2, vy: 0, r: 11 };
      pipes = [];
      score = 0;
      alive = true;
      started = false;
      spawnAcc = 0;
      speed = 120;
      scroll = 0;
      st.setScore(0);
      st.hideOverlay();
    };

    const flap = () => {
      if (!alive) return;
      if (!started) {
        started = true;
        pipes.push(makePipe(W + 40), makePipe(W + 40 + 200));
      }
      bird.vy = -330;
      sfx("flip");
    };

    const makePipe = (x) => {
      const gap = 132;
      const top = rand(60, H - GROUND - gap - 60);
      return { x, top, gap, passed: false };
    };

    const die = () => {
      if (!alive) return;
      alive = false;
      sfx("hit");
      ctx.report(score);
      st.end({ score, title: "Nabrak! 💥", sub: `Skor ${score}`, retry: start });
    };

    st.onTap(flap);
    st.onKeyDown((k) => {
      if (k === "space" || k === "up" || k === "enter") {
        if (!alive) start();
        else flap();
      }
    });

    st.loop((dt) => {
      if (alive) {
        if (started) {
          bird.vy += 1050 * dt;
          bird.y += bird.vy * dt;
          speed = 120 + Math.min(70, score * 3);
          scroll += speed * dt;
          spawnAcc += speed * dt;

          for (const p of pipes) p.x -= speed * dt;
          if (pipes.length && pipes[0].x < -60) pipes.shift();
          if (spawnAcc > 190) {
            spawnAcc = 0;
            pipes.push(makePipe(W + 20));
          }

          if (bird.y + bird.r > H - GROUND) {
            bird.y = H - GROUND - bird.r;
            die();
          }
          if (bird.y - bird.r < 0) {
            bird.y = bird.r;
            bird.vy = 40;
          }

          for (const p of pipes) {
            if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + 54) {
              if (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap) die();
            }
            if (!p.passed && p.x + 54 < bird.x) {
              p.passed = true;
              score++;
              st.setScore(score);
              sfx("point");
            }
          }
        } else {
          bird.y = H / 2 + Math.sin(performance.now() / 300) * 8;
        }
      }

      const c = st.ctx;
      // langit
      const sky = c.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0d1730");
      sky.addColorStop(1, "#122346");
      c.fillStyle = sky;
      c.fillRect(0, 0, W, H);

      // bintang / awan pixel
      c.fillStyle = "rgba(255,255,255,0.10)";
      for (let i = 0; i < 14; i++) {
        const x = (i * 73 + 17) % W;
        const y = (i * 47 + 31) % (H - 120);
        c.fillRect(x, y, 2, 2);
      }

      // pipa
      for (const p of pipes) {
        c.fillStyle = "#22c55e";
        c.fillRect(p.x, 0, 54, p.top);
        c.fillStyle = "#16a34a";
        c.fillRect(p.x - 3, p.top - 14, 60, 14);
        c.fillStyle = "#22c55e";
        c.fillRect(p.x, p.top + p.gap, 54, H);
        c.fillStyle = "#16a34a";
        c.fillRect(p.x - 3, p.top + p.gap, 60, 14);
        c.fillStyle = "rgba(255,255,255,0.18)";
        c.fillRect(p.x + 6, p.top + p.gap + 16, 6, H);
        c.fillRect(p.x + 6, 0, 6, p.top - 16);
      }

      // tanah
      c.fillStyle = "#0a1220";
      c.fillRect(0, H - GROUND, W, GROUND);
      c.fillStyle = "#1b2b47";
      c.fillRect(0, H - GROUND, W, 8);
      c.fillStyle = "rgba(120,160,255,0.25)";
      for (let i = 0; i < 12; i++) {
        const x = ((i * 32 - scroll) % (W + 32) + W + 32) % (W + 32) - 32;
        c.fillRect(x, H - GROUND + 16, 18, 3);
      }

      // burung
      c.save();
      c.translate(bird.x, bird.y);
      c.rotate(Math.max(-0.5, Math.min(0.9, bird.vy / 600)));
      c.fillStyle = "#fbbf24";
      c.beginPath();
      c.arc(0, 0, bird.r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fde68a";
      c.beginPath();
      c.arc(-3, -3, bird.r * 0.55, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#0b0f1c";
      c.beginPath();
      c.arc(4, -4, 2.4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#f97316";
      c.beginPath();
      c.moveTo(9, 0);
      c.lineTo(18, 3);
      c.lineTo(9, 6);
      c.closePath();
      c.fill();
      c.restore();

      // skor besar
      if (started) {
        c.fillStyle = "rgba(255,255,255,0.85)";
        c.font = "bold 34px ui-monospace, monospace";
        c.textAlign = "center";
        c.fillText(String(score), W / 2, 60);
        c.textAlign = "start";
      }
    });

    start();
    return { destroy: st.destroy };
  },
};
