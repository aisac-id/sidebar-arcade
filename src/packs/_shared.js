// Helper kecil yang dipakai beberapa pack game (kartu, dadu, layar).
import { createScreen, h, shuffle } from "../lib/kit.js";

export function mkScreen(ctx, title, subtitle, mode = "max", best = ctx.best) {
  const scr = createScreen(ctx.root, {
    title,
    subtitle,
    best,
    bestMode: mode,
    onBest: ctx.report,
  });
  const wrap = h("div", { class: "pad-wrap" });
  scr.body.append(wrap);
  return { scr, wrap };
}

export function note(wrap, text = "") {
  const el = h("p", { class: "note", text });
  wrap.append(el);
  return el;
}

export const SUITS = ["♠", "♥", "♦", "♣"];
export const RANKS = { 11: "J", 12: "Q", 13: "K", 14: "A" };
export const rankTxt = (r) => RANKS[r] || String(r);
export const isRed = (c) => c.s === "♥" || c.s === "♦";

export function newDeck() {
  const d = [];
  for (const s of SUITS) for (let r = 2; r <= 14; r++) d.push({ r, s });
  return shuffle(d);
}

export function cardEl(c, hidden = false) {
  if (!c) return h("div", { class: "pcard empty" });
  if (hidden) return h("div", { class: "pcard back" }, [h("span", { text: "🂠" })]);
  return h("div", { class: "pcard" + (isRed(c) ? " red" : "") }, [
    h("b", { text: rankTxt(c.r) }),
    h("span", { text: c.s }),
  ]);
}

export const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
export function dieEl(v, extra = "") {
  return h("div", { class: "die" + extra }, [h("span", { text: DICE_FACES[v] || "?" })]);
}

export function setGrid(el, cols, gap = "4px") {
  el.style.display = "grid";
  el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  el.style.gap = gap;
}

export function guard(scr) {
  let alive = true;
  scr.destroyFns.push(() => {
    alive = false;
  });
  return () => alive;
}
