import { GAMES, CATEGORY_ORDER } from "./registry.js";
import { get, set } from "./lib/store.js";
import { h, setMuted, sfx } from "./lib/kit.js";

const tabsEl = document.getElementById("tabs");
const mainEl = document.getElementById("main");
const searchEl = document.getElementById("search");
const soundBtn = document.getElementById("soundBtn");
const randomBtn = document.getElementById("randomBtn");
const bigBtn = document.getElementById("bigBtn");
const fsBtn = document.getElementById("fsBtn");

/* ------------------------- mode layar besar / fullscreen ------------------------- */
const params = new URLSearchParams(location.search);
const isExtensionPage = typeof chrome !== "undefined" && !!chrome.runtime?.id;
const BIG = params.get("big") === "1" || (window.innerWidth >= 760 && params.get("panel") !== "1");

if (BIG) {
  document.body.classList.add("big");
  const scrim = h("div", {
    class: "nav-scrim",
    onclick: () => document.body.classList.remove("nav-open"),
  });
  const navBtn = h("button", {
    class: "big-toggle",
    type: "button",
    text: "☰",
    title: "Daftar game (Esc untuk tutup)",
    "aria-label": "Daftar game",
    onclick: () => document.body.classList.toggle("nav-open"),
  });
  document.body.append(scrim, navBtn);
}

/* panel samping ala kabinet arcade (hanya mode layar besar) */
let railTitle = null;
let railDesc = null;
let railTag = null;
let railBest = null;
let railLive = null;
let scoreObs = null;

if (BIG) {
  const kbd = (key, text) => h("div", {}, [h("kbd", { text: key }), text]);
  railTag = h("span", { class: "rail-badge", text: "OFFLINE" });
  railTitle = h("h3", { class: "rail-title", text: "Pilih game" });
  railDesc = h("p", { class: "rail-desc", text: "Buka daftar game lewat tombol ☰, atau tekan 🎲 untuk main acak." });
  railBest = h("b", { text: "—" });
  railLive = h("div", { class: "rail-live", text: "0" });

  const left = h("aside", { class: "arcade-rail left" }, [
    railTag,
    railTitle,
    railDesc,
    h("div", { class: "rail-stat alt" }, [h("i", { text: "BEST" }), railBest]),
    h("div", { class: "rail-keys" }, [
      kbd("F", "layar penuh"),
      kbd("Esc", "tutup daftar game"),
      kbd("← →", "gerak / pilih"),
      kbd("Spasi", "aksi utama"),
    ]),
  ]);

  const right = h("aside", { class: "arcade-rail right" }, [
    h("div", { class: "rail-kicker", text: "Live score" }),
    railLive,
    h("div", { class: "rail-actions" }, [
      h("button", {
        class: "rail-btn",
        type: "button",
        onclick: () => document.body.classList.toggle("nav-open"),
      }, [h("span", { text: "DAFTAR" }), "Ganti game ☰"]),
      h("button", {
        class: "rail-btn",
        type: "button",
        onclick: () => randomBtn.click(),
      }, [h("span", { text: "RNG" }), "Game acak 🎲"]),
      h("button", {
        class: "rail-btn",
        type: "button",
        onclick: () => toggleFullscreen(),
      }, [h("span", { text: "F" }), "Layar penuh ▣"]),
    ]),
    h("div", { class: "rail-kicker", text: "Status" }),
    h("div", { class: "rail-desc", text: "100% offline · tanpa iklan · skor tersimpan lokal" }),
  ]);

  document.body.append(left, right);
}

function updateRail(def) {
  if (!BIG || !railTitle) return;
  railTitle.textContent = `${def.emoji} ${def.name}`;
  railDesc.textContent = def.desc;
  railTag.textContent = def.tag.toUpperCase();
  const best = state.bests[def.id];
  railBest.textContent = best === undefined || best === null ? "—" : String(best);
  railLive.textContent = "0";
  scoreObs?.disconnect();
  const el = mainEl.querySelector(".js-score");
  if (el) {
    railLive.textContent = el.textContent || "0";
    scoreObs = new MutationObserver(() => {
      railLive.textContent = el.textContent || "0";
    });
    scoreObs.observe(el, { childList: true, characterData: true, subtree: true });
  }
}


function openBigTab() {
  const game = state.current?.def.id;
  const q = "?big=1" + (game ? `&game=${encodeURIComponent(game)}` : "");
  const url = isExtensionPage ? chrome.runtime.getURL(`sidepanel.html${q}`) : `sidepanel.html${q}`;
  if (isExtensionPage && chrome.tabs?.create) chrome.tabs.create({ url });
  else window.open(url, "_blank", "noopener");
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {
      sfx("tick");
    });
  } else {
    document.exitFullscreen?.();
  }
}

function paintFs() {
  if (!fsBtn) return;
  const on = !!document.fullscreenElement;
  fsBtn.textContent = on ? "▢" : "▣";
  fsBtn.title = on ? "Keluar dari layar penuh" : "Layar penuh";
  fsBtn.classList.toggle("on", on);
}
document.addEventListener("fullscreenchange", paintFs);
paintFs();

if (bigBtn) {
  if (BIG) bigBtn.hidden = true;
  bigBtn.addEventListener("click", openBigTab);
}
fsBtn?.addEventListener("click", () => {
  // Di panel sempit, fullscreen API biasanya diblokir — buka tab besar dulu.
  if (!BIG) openBigTab();
  else toggleFullscreen();
});

document.addEventListener("keydown", (e) => {
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
  if (e.key === "f" || e.key === "F") {
    e.preventDefault();
    if (!BIG) openBigTab();
    else toggleFullscreen();
  } else if (e.key === "Escape") {
    document.body.classList.remove("nav-open");
  }
});


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
  updateRail(def);
  const activeTab = tabsEl.querySelector(`.tab[data-id="${def.id}"]`);
  activeTab?.scrollIntoView({ block: "nearest" });

  if (remember) set("lastGame", def.id);
  if (BIG) {
    document.body.classList.remove("nav-open");
    history.replaceState(null, "", `?big=1&game=${encodeURIComponent(def.id)}`);
  }
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
  if (BIG && railBest && state.current?.def.id === def.id) railBest.textContent = String(score);

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

  const wanted = params.get("game");
  const last = await get("lastGame", null);
  if (wanted && GAMES.some((g) => g.id === wanted)) select(wanted, { remember: false });
  else if (last && GAMES.some((g) => g.id === last)) select(last, { remember: false });
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
