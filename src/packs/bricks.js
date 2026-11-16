// Pack pecah-bata. 5 game.
import { createBricks } from "../lib/engines/bricks.js";

function brick(id, name, emoji, desc, cfg) {
  return {
    id,
    name,
    emoji,
    tag: "Arcade",
    desc,
    bestMode: "max",
    mount(ctx) {
      return createBricks(ctx, { title: `${emoji} ${name}`, subtitle: cfg.hint || "Geser paddle · tap untuk lempar bola", ...cfg });
    },
  };
}

export const bricks = [
  brick("brick-blitz", "Brick Blitz", "🧱", "Pecahkan semua bata secepat mungkin.", {
    cols: 8,
    rows: 6,
    ballSpeed: 240,
    lives: 3,
  }),
  brick("brick-wall", "Brick Wall", "🏗️", "Dinding bata berlapis, butuh sabar.", {
    cols: 9,
    rows: 7,
    hpPattern: "rows",
    brickH: 14,
    ballSpeed: 225,
    lives: 3,
  }),
  brick("neon-bricks", "Neon Bricks", "🌃", "Bata neon di malam hari.", {
    cols: 8,
    rows: 7,
    hpPattern: "checker",
    ballSpeed: 250,
    lives: 3,
    bg: ["#080312", "#241040"],
  }),
  brick("brick-rain", "Brick Rain", "🌧️", "Bata turun terus. Jangan sampai menyentuh bawah!", {
    cols: 7,
    rows: 5,
    descend: true,
    ballSpeed: 235,
    lives: 3,
  }),
  brick("bomb-bricks", "Bomb Bricks", "💣", "Bata bom meledak dan menghancurkan sekitarnya.", {
    cols: 8,
    rows: 6,
    bombs: true,
    hpPattern: "random",
    ballSpeed: 245,
    lives: 3,
  }),
];
