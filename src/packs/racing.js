// Pack balap / hindar lajur. 10 game.
import { createLaner } from "../lib/engines/laner.js";

function racer(id, name, emoji, desc, cfg) {
  return {
    id,
    name,
    emoji,
    tag: "Racing",
    desc,
    bestMode: "max",
    mount(ctx) {
      return createLaner(ctx, { title: `${emoji} ${name}`, subtitle: cfg.hint || "Geser kiri-kanan · ambil koin", ...cfg });
    },
  };
}

export const racing = [
  racer("highway-racer", "Highway Racer", "🏎️", "Ngebut di jalan raya, salip mobil.", {
    theme: "highway",
    car: "car",
    obstacle: "car",
    color: "#4ee1ff",
    lanes: 3,
    speed: 200,
    lives: 2,
  }),
  racer("bike-lane", "Bike Lane", "🏍️", "Motor lincah di antara truk besar.", {
    theme: "highway",
    car: "bike",
    obstacle: "truck",
    color: "#fbbf24",
    lanes: 4,
    speed: 185,
    lives: 2,
  }),
  racer("train-dodge", "Train Dodge", "🚆", "Hindari kereta lain di rel gelap.", {
    theme: "subway",
    car: "train",
    obstacle: "train",
    obsColor: "#f472b6",
    lanes: 2,
    speed: 175,
    lives: 2,
    coins: false,
  }),
  racer("plane-dodger", "Plane Dodger", "✈️", "Pesawat di langit, hindari pesawat lain.", {
    theme: "sky",
    car: "plane",
    obstacle: "plane",
    color: "#0ea5e9",
    obsColor: "#dc2626",
    lanes: 4,
    speed: 210,
    lives: 2,
  }),
  racer("night-drive", "Night Drive", "🌙", "Berkendara malam dengan lampu neon.", {
    theme: "night",
    car: "car",
    obstacle: "car",
    color: "#a78bfa",
    lanes: 3,
    speed: 215,
    lives: 2,
  }),
  racer("truck-traffic", "Truck Traffic", "🚚", "Nyetir truk besar di jalan padat.", {
    theme: "highway",
    car: "truck",
    obstacle: "car",
    color: "#a3e635",
    lanes: 3,
    speed: 170,
    lives: 3,
  }),
  racer("boat-rapids", "Boat Rapids", "🚤", "Perahu cepat di sungai, hindari batu.", {
    theme: "ocean",
    car: "boat",
    obstacle: "boat",
    color: "#fbbf24",
    obsColor: "#ef4444",
    lanes: 3,
    speed: 190,
    lives: 2,
  }),
  racer("desert-rally", "Desert Rally", "🏜️", "Rally gurun pasir yang panas.", {
    theme: "desert",
    car: "car",
    obstacle: "truck",
    color: "#f97316",
    lanes: 3,
    speed: 220,
    lives: 2,
  }),
  racer("hover-racer", "Hover Racer", "🛸", "Balap hover di jalur neon masa depan.", {
    theme: "night",
    car: "hover",
    obstacle: "hover",
    color: "#ff6bd6",
    obsColor: "#4ee1ff",
    lanes: 4,
    speed: 230,
    lives: 2,
  }),
  racer("tunnel-dash", "Tunnel Dash", "🚇", "Terowongan cepat, jangan sampai nabrak.", {
    theme: "subway",
    car: "hover",
    obstacle: "train",
    color: "#4ee1ff",
    obsColor: "#fb7185",
    lanes: 3,
    speed: 240,
    lives: 2,
  }),
];
