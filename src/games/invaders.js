import { createStage, COLORS, sfx, clamp } from "../lib/kit.js";

const W = 320;
const H = 400;
const GROUND_Y = H - 26;

const SPRITE = [
  "00100000100",
  "00010001000",
  "00111111100",
  "01101110110",
  "11111111111",
  "10111111101",
  "10100000101",
  "00011011000",
];

export default {
  id: "invaders",
  name: "Invaders",
  emoji: "👾",
  tag: "Arcade",
  desc: "Tembak pasukan alien sebelum mereka mendarat.",
  bestMode: "max",
  mount(ctx) {
    const st = createStage(ctx.root, {
      w: W,
      h: H,
      title: "👾 Invaders",
      subtitle: "← → gerak · spasi tembak",
      best: ctx.best,
      onBest: ctx.report,
    });

    let ship, bullets, bombs, fleet, dir, score, lives, cooldown, bombTimer, wave;

    const buildFleet = () => {
      fleet = [];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 6; c++)
          fleet.push({ x: 24 + c * 46, y: 58 + r * 32, alive: true, row: r });
    };

    const start = () => {
      ship = { x: W / 2 - 14, y: GROUND_Y - 18, w: 28, h: 16 };
      bullets = [];
      bombs = [];
      buildFleet();
      dir = 1;
      score = 0;
      lives = 3;
      cooldown = 0;
      bombTimer = 0.8;
      wave = 1;
      st.setScore(0);
      st.hideOverlay();
    };

    const shoot = () => {
      if (cooldown > 0 || !lives) return;
      bullets.push({ x: ship.x + ship.w / 2, y: ship.y - 4 });
      cooldown = 0.28;
      sfx("tick");
    };

    const loseLife = () => {
      lives--;
      sfx("hit");
      if (lives <= 0) {
        ctx.report(score);
        st.end({ score, title: "Game Over", sub: `Gelombang ${wave} · ${score} poin`, retry: start });
      }
    };

    st.onKeyDown((k) => {
      if (!lives) {
        if (k === "space" || k === "enter") start();
        return;
      }
      if (k === "space" || k === "fire") shoot();
    });
    st.onTap(() => lives && shoot());
    st.pad(["left", "right", "fire"]);

    const drawInvader = (x, y, color) => {
      const px = 2;
      st.ctx.fillStyle = color;
      SPRITE.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] === "1") st.ctx.fillRect(x + rx * px, y + ry * px, px, px);
        }
      });
    };

    st.loop((dt) => {
      if (lives) {
        cooldown = Math.max(0, cooldown - dt);

        const sp = 210 * dt;
        if (st.isDown("left")) ship.x = clamp(ship.x - sp, 6, W - ship.w - 6);
        if (st.isDown("right")) ship.x = clamp(ship.x + sp, 6, W - ship.w - 6);
        if (st.isDown("space", "fire")) shoot();

        // armada
        const aliveList = fleet.filter((f) => f.alive);
        const speed = (16 + (24 - aliveList.length) * 1.6 + wave * 4) * dir * dt;
        let hitEdge = false;
        for (const f of aliveList) {
          f.x += speed;
          if (f.x < 8 || f.x > W - 30) hitEdge = true;
        }
        if (hitEdge) {
          dir *= -1;
          for (const f of aliveList) f.y += 14;
        }
        if (aliveList.some((f) => f.y + 18 >= ship.y)) {
          lives = 0;
          sfx("over");
          ctx.report(score);
          st.end({ score, title: "Mendarat! 💥", sub: `Gelombang ${wave} · ${score} poin`, retry: start });
        }

        // peluru
        for (const b of bullets) b.y -= 360 * dt;
        bullets = bullets.filter((b) => b.y > -10);

        // bom
        bombTimer -= dt;
        if (bombTimer <= 0 && aliveList.length) {
          bombTimer = Math.max(0.4, 1.4 - wave * 0.12);
          const src = aliveList[Math.floor(Math.random() * aliveList.length)];
          bombs.push({ x: src.x + 11, y: src.y + 18 });
        }
        for (const b of bombs) b.y += (120 + wave * 18) * dt;
        bombs = bombs.filter((b) => {
          if (b.y > H) return false;
          if (b.x > ship.x && b.x < ship.x + ship.w && b.y > ship.y && b.y < ship.y + ship.h) {
            loseLife();
            return false;
          }
          return true;
        });

        // tabrakan peluru
        for (const b of bullets) {
          for (const f of fleet) {
            if (!f.alive) continue;
            if (b.x > f.x && b.x < f.x + 22 && b.y > f.y && b.y < f.y + 16) {
              f.alive = false;
              b.y = -20;
              score += 10;
              st.setScore(score);
              sfx("point");
              break;
            }
          }
        }
        bullets = bullets.filter((b) => b.y > -10);

        if (!fleet.some((f) => f.alive)) {
          wave++;
          score += 50;
          st.setScore(score);
          sfx("win");
          buildFleet();
          dir = 1;
          bombs = [];
        }
      }

      // gambar
      const c = st.ctx;
      c.fillStyle = COLORS.bg;
      c.fillRect(0, 0, W, H);

      c.fillStyle = "rgba(120,160,255,0.10)";
      for (let i = 0; i < 24; i++) {
        const x = (i * 97 + 11) % W;
        const y = (i * 53 + 23) % (H - 40);
        c.fillRect(x, y, 1.5, 1.5);
      }

      for (const f of fleet) {
        if (f.alive) drawInvader(f.x, f.y, [COLORS.pink, COLORS.violet, COLORS.cyan, COLORS.lime][f.row % 4]);
      }

      // ship
      c.fillStyle = COLORS.amber;
      c.beginPath();
      c.moveTo(ship.x + ship.w / 2, ship.y - 4);
      c.lineTo(ship.x + ship.w, ship.y + ship.h);
      c.lineTo(ship.x, ship.y + ship.h);
      c.closePath();
      c.fill();
      c.fillStyle = COLORS.cyan;
      c.fillRect(ship.x + ship.w / 2 - 2, ship.y + 6, 4, ship.h - 8);

      for (const b of bullets) {
        c.fillStyle = "#fff6d5";
        c.fillRect(b.x - 1.5, b.y, 3, 9);
      }
      for (const b of bombs) {
        c.fillStyle = COLORS.red;
        c.fillRect(b.x - 1.5, b.y, 3, 8);
      }

      c.fillStyle = COLORS.dim;
      c.font = "11px ui-monospace, monospace";
      c.fillText("WAVE " + wave, 10, H - 8);
      for (let i = 0; i < lives; i++) {
        c.fillStyle = COLORS.pink;
        c.fillRect(W - 16 - i * 14, H - 15, 8, 8);
      }
    });

    start();
    return { destroy: st.destroy };
  },
};
