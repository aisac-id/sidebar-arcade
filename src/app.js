import { GAMES, CATEGORY_ORDER } from "./registry.js";
import { get, set } from "./lib/store.js";
import { h, setMuted, sfx } from "./lib/kit.js";

const tabsEl = document.getElementById("tabs");
const mainEl = document.getElementById("main");
const searchEl = document.getElementById("search");
const soundBtn = document.getElementById("soundBtn");
const randomBtn = document.getElementById("randomBtn");

const state = {
  bests: {},
  muted: false,
  filter: "",
  current: null, // { def, instance }
};

let saveTimer = null;

/* ------------------------------- render tabs ------------------------------- */
function renderTabs() {
  tabsEl.innerHTML = "";
  const q = state.filter.trim().toLowerCase();
  let shown = 0;

  for (const tag of CATEGORY_ORDER) {
    const list = GAMES.filter((g) => g.tag === tag && (!q || g.name.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q)));
    if (!list.length) continue;
    tabsEl.append(h("div", { class: "tab-group", text: tag }));
    for (const game of list) {
      const best = state.bests[game.id];
      const active = state.current && state.current.def.id === game.id;
      const btn = h(
        "button",
        {
          class: "tab" + (active ? " active" : ""),
          type: "button",
          title: `${game.name} — ${game.desc}`,
          "data-id": game.id,
          onclick: () => select(game.id),
        },
        [
          h("span", { class: "tab-emoji", text: game.emoji }),
          h("span", { class: "tab-text" }, [
            h("span", { class: "tab-name", text: game.name }),
            best !== undefined && best !== null ? h("span", { class: "tab-best", text: `🏆 ${best}` }) : null,
          ]),
        ]
      );
      tabsEl.append(btn);
      shown++;
    }
  }

  if (!shown) {
    tabsEl.append(h("p", { class: "note", text: "Game tidak ditemukan." }));
  }
}

/* --------------------------------- pilih game ------------------------------- */
function select(id, { remember = true } = {}) {
  const def = GAMES.find((g) => g.id === id);
  if (!def) return;

  if (state.current) {
    try {
      state.current.instance?.destroy?.();
    } catch (err) {
      console.warn("[Sidebar Arcade] destroy error:", err);
    }
    state.current = null;
  }

  mainEl.innerHTML = "";
  const host = h("div", {});
  mainEl.append(host);

  const ctx = {
    root: host,
    best: state.bests[def.id] ?? null,
    bestMode: def.bestMode || "max",
    report: (score) => reportScore(def, score),
  };

  let instance = null;
  try {
    instance = def.mount(ctx) || {};
  } catch (err) {
    console.error("[Sidebar Arcade] gagal memuat game:", err);
    mainEl.innerHTML = "";
    mainEl.append(
      h("div", { class: "empty" }, [
        h("div", { class: "empty-inner" }, [
          h("div", { class: "empty-emoji", text: "🛠️" }),
          h("h1", { text: "Game gagal dimuat" }),
          h("p", { text: String(err && err.message ? err.message : err) }),
        ]),
      ])
    );
    return;
  }

  state.current = { def, instance };
  renderTabs();
  const activeTab = tabsEl.querySelector(`.tab[data-id="${def.id}"]`);
  activeTab?.scrollIntoView({ block: "nearest" });

  if (remember) set("lastGame", def.id);
  sfx("click");
}

function reportScore(def, score) {
  if (!Number.isFinite(score)) return;
  const min = def.bestMode === "min";
  // Skor 0 bukan rekor untuk game "makin besar makin baik".
  if (!min && score <= 0) return;
  const best = state.bests[def.id];
  const better = best === undefined || best === null || (min ? score < best : score > best);
  if (!better) return;

  state.bests[def.id] = score;
  updateTabBest(def.id);

  // Skor bisa naik tiap frame (mis. Racer) — simpan ke storage secara debounce.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => set("bests", state.bests), 400);
}

function updateTabBest(id) {
  const value = state.bests[id];
  if (value === undefined || value === null) return;
  const tab = tabsEl.querySelector(`.tab[data-id="${id}"]`);
  if (!tab) return;
  const text = tab.querySelector(".tab-text");
  let el = tab.querySelector(".tab-best");
  if (!el) {
    el = h("span", { class: "tab-best" });
    text.append(el);
  }
  el.textContent = `🏆 ${value}`;
}

/* ----------------------------------- sound ---------------------------------- */
function paintSound() {
  soundBtn.textContent = state.muted ? "🔇" : "🔊";
  soundBtn.title = state.muted ? "Suara: mati" : "Suara: nyala";
}

soundBtn.addEventListener("click", () => {
  state.muted = !state.muted;
  setMuted(state.muted);
  set("muted", state.muted);
  paintSound();
  if (!state.muted) sfx("click");
});

randomBtn.addEventListener("click", () => {
  const pool = GAMES.filter((g) => !state.current || g.id !== state.current.def.id);
  const pickGame = pool[Math.floor(Math.random() * pool.length)];
  if (pickGame) select(pickGame.id);
});

searchEl.addEventListener("input", () => {
  state.filter = searchEl.value;
  renderTabs();
});

searchEl.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    searchEl.value = "";
    state.filter = "";
    renderTabs();
    searchEl.blur();
  }
});

/* ----------------------------------- init ---------------------------------- */
async function init() {
  state.bests = (await get("bests", {})) || {};
  state.muted = !!(await get("muted", false));
  setMuted(state.muted);
  paintSound();

  const brandSub = document.querySelector(".brand-sub");
  if (brandSub) brandSub.textContent = `${GAMES.length} game · offline`;

  renderTabs();

  const last = await get("lastGame", null);
  if (last && GAMES.some((g) => g.id === last)) select(last, { remember: false });
}

init();

// Simpan skor yang masih tertahan di debounce saat panel disembunyikan/ditutup,
// dan segarkan daftar tab saat panel dibuka lagi.
function flushBests() {
  if (!saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  set("bests", state.bests);
}

window.addEventListener("pagehide", flushBests);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushBests();
  else renderTabs();
});
