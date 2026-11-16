// Pack pelari & terbang. 6 game.
import { createRunner } from "../lib/engines/runner.js";

function runner(id, name, emoji, desc, cfg) {
  return {
    id,
    name,
    emoji,
    tag: "Arcade",
    desc,
    bestMode: "max",
    mount(ctx) {
      return createRunner(ctx, { title: `${emoji} ${name}`, subtitle: cfg.hint || "Tap / spasi untuk lompat", ...cfg });
    },
  };
}

export const runners = [
  runner("nitro-runner", "Nitro Runner", "🏃", "Lari kencang di kota, lompat dua kali.", {
    theme: "city",
    mode: "ground",
    runner: "human",
    color: "#4ee1ff",
    doubleJump: true,
    speed: 185,
  }),
  runner("dino-run", "Dino Run", "🦖", "Dino kabur di gurun, lompat kaktus.", {
    theme: "desert",
    mode: "ground",
    runner: "dino",
    color: "#65a30d",
    obsColor: "#7c2d12",
    speed: 180,
  }),
  runner("parkour-dash", "Parkour Dash", "🤸", "Parkour neon, lompat dan merunduk.", {
    theme: "neon",
    mode: "ground",
    runner: "human",
    color: "#ff6bd6",
    obsColor: "#a78bfa",
    doubleJump: true,
    speed: 195,
    hint: "Tap lompat · panah bawah untuk merunduk",
  }),
  runner("jetpack-run", "Jetpack Run", "🚀", "Jetpack di kota, tahan untuk terbang.", {
    theme: "city",
    mode: "jet",
    runner: "jet",
    color: "#fbbf24",
    obsColor: "#fb7185",
    speed: 150,
    hint: "Tahan tap / atas untuk dorong jetpack",
  }),
  runner("cave-flyer", "Cave Flyer", "🦇", "Terbang di gua sempit, jangan nabrak.", {
    theme: "cave",
    mode: "fly",
    runner: "bird",
    color: "#c084fc",
    obsColor: "#7c3aed",
    speed: 140,
  }),
  runner("helicopter-cave", "Heli Cave", "🚁", "Helikopter menyusuri gua gelap.", {
    theme: "cave",
    mode: "fly",
    runner: "heli",
    color: "#4ee1ff",
    obsColor: "#f472b6",
    speed: 150,
    gravity: 880,
  }),
];
