// Kit kecil untuk semua game: elemen DOM, layar, canvas loop, input, dan sfx.
// Semua game di folder ../games memakai API ini supaya konsisten.

/* ---------------------------------- DOM ---------------------------------- */
export function h(tag, props = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = String(v);
    else if (k === "html") el.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids.flat(4)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const fmt = (n) => (n === null || n === undefined || !isFinite(n) ? "—" : String(n));

/* ---------------------------------- SFX ---------------------------------- */
let audioCtx = null;
let muted = false;

const TONES = {
  click: [520, 0.04, "square", 0.03],
  flip: [440, 0.05, "sine", 0.035],
  point: [720, 0.09, "triangle", 0.05],
  hit: [170, 0.12, "sawtooth", 0.045],
  drop: [300, 0.08, "square", 0.035],
  over: [220, 0.45, "sine", 0.06],
  win: [740, 0.32, "triangle", 0.06],
  tick: [980, 0.03, "square", 0.025],
};

export function sfx(kind = "click") {
  if (muted) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const [freq, dur, type, vol] = TONES[kind] || TONES.click;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (kind === "over") osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + dur);
    if (kind === "win") osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  } catch {
    /* audio bisa diblokir browser — abaikan */
  }
}

export function setMuted(v) {
  muted = !!v;
}
export function isMuted() {
  return muted;
}

/* --------------------------------- LAYAR --------------------------------- */
const KEY_ALIAS = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  " ": "space",
  Spacebar: "space",
  Escape: "escape",
  Enter: "enter",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};

function baseScreen(root, opts = {}) {
  const { title = "", subtitle = "", best = null, bestMode = "max", onBest = null } = opts;
  root.innerHTML = "";
  root.classList.add("game-screen");

  const scoreEl = h("b", { class: "js-score", text: "0" });
  const bestEl = h("b", { class: "js-best", text: fmt(best) });
  const head = h("div", { class: "game-head" }, [
    h("div", { class: "game-head-l" }, [
      h("h2", { class: "game-title", text: title }),
      subtitle ? h("p", { class: "game-sub", text: subtitle }) : null,
    ]),
    h("div", { class: "chips" }, [
      h("span", { class: "chip" }, [h("i", { text: "BEST" }), bestEl]),
      h("span", { class: "chip chip-score" }, [h("i", { text: "SCORE" }), scoreEl]),
    ]),
  ]);

  const body = h("div", { class: "screen-body" });
  const overlay = h("div", { class: "overlay hidden" });
  body.append(overlay);
  root.append(head, body);

  let bestValue = best;
  const listen = [];
  const emit = (name, detail) => listen.forEach((fn) => fn(name, detail));

  const setScore = (n) => {
    scoreEl.textContent = fmt(n);
    let improved = false;
    if (bestMode === "min") {
      // 0 dipakai game sebagai "reset", jangan dianggap rekor baru.
      if (n > 0 && (bestValue === null || bestValue === undefined || n < bestValue)) {
        bestValue = n;
        bestEl.textContent = fmt(bestValue);
        improved = true;
      }
    } else if (n > 0 && (bestValue === null || bestValue === undefined || n > bestValue)) {
      bestValue = n;
      bestEl.textContent = fmt(bestValue);
      improved = true;
    }
    if (improved && onBest) onBest(bestValue);
  };

  const showOverlay = ({ title: t = "Game Over", sub = "", action = "Main lagi", retry }) => {
    overlay.innerHTML = "";
    const card = h("div", { class: "overlay-card" }, [
      h("strong", { text: t }),
      sub ? h("p", { text: sub }) : null,
      retry
        ? h("button", {
            class: "btn primary",
            type: "button",
            text: action,
            onclick: () => {
              sfx("click");
              hideOverlay();
              retry();
            },
          })
        : null,
    ]);
    overlay.append(card);
    overlay.classList.remove("hidden");
  };

  const hideOverlay = () => overlay.classList.add("hidden");

  const destroyFns = [];
  const cleanup = () => {
    destroyFns.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    root.innerHTML = "";
    root.classList.remove("game-screen");
  };

  return { root, body, overlay, setScore, showOverlay, hideOverlay, cleanup, emit, listen, destroyFns };
}

/* Screen untuk game berbasis DOM (kartu, papan, dll). */
export function createScreen(root, opts = {}) {
  const base = baseScreen(root, opts);
  const setScore = base.setScore;

  const end = ({ score = 0, title = "Selesai!", sub = "", retry, action = "Main lagi", sound = "over" } = {}) => {
    if (Number.isFinite(score)) setScore(score);
    if (sound) sfx(sound);
    base.showOverlay({ title, sub, retry, action });
  };

  return {
    ...base,
    setScore,
    end,
    destroy: base.cleanup,
  };
}

/* --------------------------- Stage untuk canvas --------------------------- */
export function createStage(root, opts = {}) {
  const w = opts.w ?? 320;
  const height = opts.h ?? 400;
  const base = baseScreen(root, opts);
  const { body } = base;

  const canvas = h("canvas", { class: "game-canvas" });
  const stageWrap = h("div", { class: "stage" }, [canvas]);
  // stage mengikuti aspect ratio & tinggi viewport
  stageWrap.style.setProperty("--ar", String(w / height));
  body.append(stageWrap);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx2d = canvas.getContext("2d");
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx2d.imageSmoothingEnabled = false;

  /* ---------- input keyboard ---------- */
  const keys = new Set();
  const downHandlers = [];
  const normalize = (e) => {
    const k = e.key;
    if (KEY_ALIAS[k]) return KEY_ALIAS[k];
    return k.length === 1 ? k.toLowerCase() : k.toLowerCase();
  };
  const isTyping = (e) => {
    const t = e.target;
    return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  };
  const onKeyDown = (e) => {
    if (isTyping(e)) return;
    const k = normalize(e);
    if (["left", "right", "up", "down", "space"].includes(k)) e.preventDefault();
    if (!keys.has(k)) downHandlers.forEach((fn) => fn(k));
    keys.add(k);
  };
  const onKeyUp = (e) => {
    if (isTyping(e)) return;
    keys.delete(normalize(e));
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  /* ---------- tap, swipe & pointer ---------- */
  let swipeStart = null;
  const tapHandlers = [];
  const swipeHandlers = [];
  const pointerHandlers = [];
  const pointer = { x: w / 2, y: height / 2, down: false, inside: false };
  const toLocal = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * w,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * height,
    };
  };
  const firePointer = (type) => pointerHandlers.forEach((fn) => fn(pointer, type));
  const onPointerDown = (e) => {
    const p = toLocal(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = true;
    pointer.inside = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    firePointer("down");
    swipeStart = { x: e.clientX, y: e.clientY };
    tapHandlers.forEach((fn) => fn({ x: p.x, y: p.y }));
  };
  const onPointerMove = (e) => {
    const p = toLocal(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = true;
    firePointer("move");
  };
  const onPointerLeave = () => {
    pointer.inside = false;
  };
  const onPointerUp = (e) => {
    const p = toLocal(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = false;
    firePointer("up");
    if (!swipeStart) return;
    const dx = e.clientX - swipeStart.x;
    const dy = e.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
    const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
    swipeHandlers.forEach((fn) => fn(dir));
    downHandlers.forEach((fn) => fn(dir));
  };
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("pointerup", onPointerUp);

  /* ---------- pad tombol layar (mobile friendly) ---------- */
  const padEl = h("div", { class: "pad" });
  const PAD_LABELS = {
    left: "◀",
    right: "▶",
    up: "▲",
    down: "▼",
    rotate: "⟳",
    drop: "⤓",
    space: "␣",
    fire: "●",
  };
  const pad = (items) => {
    padEl.innerHTML = "";
    for (const key of items) {
      const btn = h("button", {
        class: "pad-btn",
        type: "button",
        text: PAD_LABELS[key] || key,
        "aria-label": key,
      });
      const hold = (e) => {
        e.preventDefault();
        if (!keys.has(key)) downHandlers.forEach((fn) => fn(key));
        keys.add(key);
        btn.classList.add("active");
      };
      const release = () => {
        keys.delete(key);
        btn.classList.remove("active");
      };
      btn.addEventListener("pointerdown", hold);
      btn.addEventListener("pointerup", release);
      btn.addEventListener("pointerleave", release);
      btn.addEventListener("pointercancel", release);
      padEl.append(btn);
    }
    body.append(padEl);
  };

  /* ---------- loop ---------- */
  let tickFn = null;
  let rafId = 0;
  let last = 0;
  let alive = true;
  let paused = false;

  const frame = (ts) => {
    if (!alive) return;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    if (!paused && tickFn) tickFn(dt, ts / 1000);
    rafId = requestAnimationFrame(frame);
  };
  rafId = requestAnimationFrame(frame);

  const onVisibility = () => {
    paused = document.hidden;
    last = 0;
  };
  document.addEventListener("visibilitychange", onVisibility);

  const loop = (fn) => {
    tickFn = fn;
  };

  const pause = (v = true) => {
    paused = v;
    last = 0;
  };

  const end = ({ score = 0, title = "Game Over", sub = "", retry, action = "Main lagi", sound = "over" } = {}) => {
    base.setScore(score);
    if (sound) sfx(sound);
    base.showOverlay({ title, sub, retry, action });
  };

  const destroy = () => {
    alive = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("visibilitychange", onVisibility);
    base.cleanup();
  };

  return {
    root,
    body,
    canvas,
    ctx: ctx2d,
    w,
    h: height,
    keys,
    pad,
    loop,
    pause,
    end,
    destroy,
    isDown: (...names) => names.some((n) => keys.has(n)),
    onKeyDown: (fn) => downHandlers.push(fn),
    pointer,
    onPointer: (fn) => pointerHandlers.push(fn),
    onTap: (fn) => tapHandlers.push(fn),
    onSwipe: (fn) => swipeHandlers.push(fn),
    setScore: base.setScore,
    hideOverlay: base.hideOverlay,
    showOverlay: base.showOverlay,
    emit: base.emit,
    listen: (fn) => base.listen.push(fn),
  };
}

/* --------------------------- helper gambar umum --------------------------- */
export function roundRect(ctx, x, y, w, hh, r) {
  const rr = Math.min(r, w / 2, hh / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + hh, rr);
  ctx.arcTo(x + w, y + hh, x, y + hh, rr);
  ctx.arcTo(x, y + hh, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export const COLORS = {
  bg: "#0b0f1c",
  panel: "#121a2c",
  grid: "rgba(120,160,255,0.08)",
  cyan: "#4ee1ff",
  violet: "#a78bfa",
  pink: "#ff6bd6",
  lime: "#a3e635",
  amber: "#fbbf24",
  red: "#fb7185",
  ink: "#e7ecf7",
  dim: "#8b96b3",
};
