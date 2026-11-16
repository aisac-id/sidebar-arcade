import { createStage, COLORS, roundRect, sfx, rand, clamp } from "../lib/kit.js";

const W = 320;
const H = 400;
const LANES = 3;
const LANE_W = W / LANES;

export default {
  id: "dodge",
  name: "Racer",
  emoji: "🏎️",
  tag: "Arcade",
  desc: "Hindari mobil lain, kumpulkan jarak sebanyak mungkin.",
  bestMode: "max",
  mount(ctx) {
    const st = createStage(ctx.root, {
      w: W,
      h: H,
      title: "🏎️ Neon Racer",
      subtitle: "← → pindah lajur · geser di layar",
      best: ctx.best,
      onBest: ctx.report,
    });

    let lane, px, obstacles, score, alive, speed, spawnTimer, scroll;

    const laneX = (l) => l * LANE_W + LANE_W / 2;

    const start = () => {
      lane = 1;
      px = laneX(1);
      obstacles = [];
      score = 0;
      alive = true;
      speed = 190;
      spawnTimer = 0.6;
      scroll = 0;
      st.setScore(0);
      st.hideOverlay();
    };

    const shift = (d) => {
      if (!alive) return;
      const next = clamp(lane + d, 0, LANES - 1);
      if (next !== lane) {
        lane = next;
        sfx("flip");
      }
    };

    st.onKeyDown((k) => {
      if (!alive) {
        if (k === "space" || k === "enter") start();
        return;
      }
      if (k === "left") shift(-1);
      if (k === "right") shift(1);
    });
    st.onSwipe((d) => {
      if (d === "left") shift(-1);
      if (d === "right") shift(1);
    });
    st.pad(["left", "right"]);

    st.loop((dt) => {
      if (alive) {
        speed = 190 + Math.min(280, score * 0.6);
        scroll += speed * dt;
        score += speed * dt * 0.1;
        st.setScore(Math.floor(score));

        px += (laneX(lane) - px) * Math.min(1, dt * 12);

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
          spawnTimer = Math.max(0.42, 1.1 - score * 0.0012);
          const blocked = obstacles.filter((o) => o.y < 60).map((o) => o.lane);
          const free = [...Array(LANES).keys()].filter((l) => !blocked.includes(l));
          if (free.length) {
            obstacles.push({ lane: free[Math.floor(Math.random() * free.length)], y: -60, hue: rand(0, 1) });
          }
        }

        for (const o of obstacles) o.y += speed * dt;
        obstacles = obstacles.filter((o) => o.y < H + 70);

        for (const o of obstacles) {
          if (Math.abs(px - laneX(o.lane)) < 26 && o.y + 58 > H - 92 && o.y < H - 34) {
            alive = false;
            sfx("hit");
            ctx.report(Math.floor(score));
            st.end({
              score: Math.floor(score),
              title: "Kecelakaan! 💥",
              sub: `${Math.floor(score)} meter`,
              retry: start,
            });
          }
        }
      }

      // gambar
      const c = st.ctx;
      c.fillStyle = "#0a0e1a";
      c.fillRect(0, 0, W, H);

      // jalan
      c.fillStyle = "#0f172b";
      c.fillRect(14, 0, W - 28, H);
      c.fillStyle = "rgba(120,160,255,0.25)";
      c.fillRect(14, 0, 2, H);
      c.fillRect(W - 16, 0, 2, H);

      // garis lajur
      c.fillStyle = "rgba(120,160,255,0.22)";
      for (let l = 1; l < LANES; l++) {
        const x = 14 + l * LANE_W - 1.5;
        for (let y = -40; y < H; y += 46) {
          const yy = ((y + scroll * 1.4) % (H + 46) + H + 46) % (H + 46) - 46;
          c.fillRect(x, yy, 3, 22);
        }
      }

      // mobil lain
      for (const o of obstacles) {
        const x = laneX(o.lane) - 15;
        const y = o.y;
        c.save();
        c.shadowColor = o.hue > 0.5 ? COLORS.pink : COLORS.red;
        c.shadowBlur = 10;
        c.fillStyle = o.hue > 0.5 ? "#ff6bd6" : "#fb7185";
        roundRect(c, x, y, 30, 56, 8);
        c.fill();
        c.restore();
        c.fillStyle = "rgba(8,17,31,0.55)";
        roundRect(c, x + 5, y + 10, 20, 14, 4);
        c.fill();
        roundRect(c, x + 5, y + 36, 20, 12, 4);
        c.fill();
        c.fillStyle = "rgba(255,255,255,0.25)";
        c.fillRect(x + 4, y + 2, 22, 3);
      }

      // mobil pemain
      const cx = px - 15;
      const cy = H - 92;
      c.save();
      c.shadowColor = COLORS.cyan;
      c.shadowBlur = 16;
      c.fillStyle = COLORS.cyan;
      roundRect(c, cx, cy, 30, 56, 8);
      c.fill();
      c.restore();
      c.fillStyle = "rgba(8,17,31,0.6)";
      roundRect(c, cx + 5, cy + 9, 20, 15, 4);
      c.fill();
      roundRect(c, cx + 5, cy + 34, 20, 13, 4);
      c.fill();
      c.fillStyle = "rgba(255,255,255,0.35)";
      c.fillRect(cx + 4, cy + 2, 22, 3);

      // kecepatan
      c.fillStyle = "rgba(231,236,247,0.5)";
      c.font = "11px ui-monospace, monospace";
      c.fillText(`${Math.floor(score)} m`, 22, H - 12);
      c.fillText(`${Math.round(speed)} km/j`, W - 82, H - 12);
    });

    start();
    return { destroy: st.destroy };
  },
};
