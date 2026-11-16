// Pack puzzle kata & logika (bagian 1). 11 game.
import { createScreen, h, clamp, rand, randInt, pick, shuffle, sfx } from "../lib/kit.js";

function screen(ctx, title, subtitle, mode = "min") {
  const scr = createScreen(ctx.root, {
    title,
    subtitle,
    best: ctx.best,
    bestMode: mode,
    onBest: ctx.report,
  });
  const wrap = h("div", { class: "puz-wrap" });
  scr.body.append(wrap);
  return { scr, wrap };
}

function timer(wrap) {
  const el = h("b", { class: "puz-timer", text: "0s" });
  wrap.append(h("div", { class: "puz-tools" }, [h("span", { class: "puz-label", text: "Waktu" }), el]));
  let t0 = performance.now();
  let id = 0;
  const start = () => {
    clearInterval(id);
    t0 = performance.now();
    el.textContent = "0s";
    id = setInterval(() => {
      el.textContent = Math.floor((performance.now() - t0) / 1000) + "s";
    }, 500);
  };
  start();
  return {
    start,
    stop() {
      clearInterval(id);
      return Math.max(1, Math.floor((performance.now() - t0) / 1000));
    },
    cancel() {
      clearInterval(id);
    },
  };
}

function msgEl(wrap) {
  const el = h("p", { class: "puz-msg", text: "" });
  wrap.append(el);
  return el;
}

/* -------------------------------- SUDOKU --------------------------------- */
function makeSudoku(n) {
  const base = n === 9 ? 3 : 2;
  const nums = shuffle([...Array(n).keys()].map((i) => i + 1));
  const rows = [];
  for (let b = 0; b < base; b++) {
    const inner = shuffle([...Array(base).keys()]);
    for (const r of inner) rows.push(b * base + r);
  }
  const cols = [];
  for (let b = 0; b < base; b++) {
    const inner = shuffle([...Array(base).keys()]);
    for (const c of inner) cols.push(b * base + c);
  }
  const sol = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => nums[(base * (rows[r] % base) + Math.floor(rows[r] / base) + cols[c]) % n]));
  return sol;
}

function sudokuGame(ctx, n, title, emoji, desc, removeCount) {
  const { scr, wrap } = screen(ctx, `${emoji} ${title}`, `Isi angka 1–${n} tanpa duplikat`, "min");
  const boardEl = h("div", { class: "sudoku s" + n });
  boardEl.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  const pad = h("div", { class: "numpad" });
  const msg = msgEl(wrap);
  wrap.append(boardEl, pad);
  const tm = timer(wrap);
  let solution, board, fixed, sel, done;

  function newGame() {
    tm.cancel();
    solution = makeSudoku(n);
    board = solution.map((r) => r.slice());
    fixed = solution.map((r) => r.map(() => false));
    const cells = [...Array(n * n).keys()];
    shuffle(cells).slice(0, removeCount).forEach((i) => {
      const r = Math.floor(i / n);
      const c = i % n;
      board[r][c] = 0;
      fixed[r][c] = true;
    });
    sel = null;
    done = false;
    msg.textContent = "Pilih kotak, lalu angka.";
    tm.start();
    render();
    scr.hideOverlay();
    pad.innerHTML = "";
    for (let v = 1; v <= n; v++) {
      pad.append(h("button", { class: "np-btn", type: "button", text: String(v), onclick: () => put(v) }));
    }
    pad.append(
      h("button", {
        class: "np-btn clear",
        type: "button",
        text: "⌫",
        onclick: () => put(0),
      })
    );
  }

  function put(v) {
    if (done || !sel) return;
    const { r, c } = sel;
    if (!fixed[r][c]) {
      board[r][c] = v;
      sfx(v ? "flip" : "click");
      render();
      checkWin();
    }
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = board[r][c];
        const cls = ["s-cell"];
        if (fixed[r][c]) cls.push("fixed");
        if (v && !fixed[r][c] && v !== solution[r][c]) cls.push("wrong");
        if (sel && sel.r === r && sel.c === c) cls.push("sel");
        boardEl.append(
          h("button", {
            class: cls.join(" "),
            type: "button",
            text: v ? String(v) : "",
            onclick: () => {
              if (done || fixed[r][c]) return;
              sel = { r, c };
              sfx("click");
              render();
            },
          })
        );
      }
    }
  }

  function checkWin() {
    const base = n === 9 ? 3 : 2;
    for (let r = 0; r < n; r++) {
      const seen = new Set();
      for (let c = 0; c < n; c++) {
        const v = board[r][c];
        if (!v || seen.has(v)) return;
        seen.add(v);
      }
    }
    for (let c = 0; c < n; c++) {
      const seen = new Set();
      for (let r = 0; r < n; r++) {
        const v = board[r][c];
        if (!v || seen.has(v)) return;
        seen.add(v);
      }
    }
    for (let br = 0; br < n; br += base) {
      for (let bc = 0; bc < n; bc += base) {
        const seen = new Set();
        for (let r = 0; r < base; r++) {
          for (let c = 0; c < base; c++) {
            const v = board[br + r][bc + c];
            if (!v || seen.has(v)) return;
            seen.add(v);
          }
        }
      }
    }
    done = true;
    const secs = tm.stop();
    sfx("win");
    scr.end({ score: secs, title: "Selesai!", sub: `${secs} detik`, retry: newGame, action: "Main lagi" });
  }

  newGame();
  return {
    destroy() {
      tm.cancel();
      scr.destroy();
    },
  };
}

/* ------------------------------ FIFTEEN ---------------------------------- */
function fifteen(ctx) {
  const { scr, wrap } = screen(ctx, "🔢 Fifteen Puzzle", "Geser kotak ke ruang kosong", "min");
  const grid = h("div", { class: "tile-grid" });
  grid.style.gridTemplateColumns = "repeat(4, 1fr)";
  const msg = msgEl(wrap);
  wrap.append(grid);
  let tiles, moves, done;
  function newGame() {
    tiles = [...Array(15).keys()].map((i) => i + 1).concat([0]);
    // acak dengan langkah legal supaya selalu bisa diselesaikan
    let blank = 15;
    for (let k = 0; k < 400; k++) {
      const r = Math.floor(blank / 4);
      const c = blank % 4;
      const opts = [];
      if (r > 0) opts.push(blank - 4);
      if (r < 3) opts.push(blank + 4);
      if (c > 0) opts.push(blank - 1);
      if (c < 3) opts.push(blank + 1);
      const pickIdx = opts[Math.floor(Math.random() * opts.length)];
      [tiles[blank], tiles[pickIdx]] = [tiles[pickIdx], tiles[blank]];
      blank = pickIdx;
    }
    if (tiles.every((v, k) => (k === 15 ? v === 0 : v === k + 1))) {
      [tiles[14], tiles[15]] = [tiles[15], tiles[14]];
    }
    moves = 0;
    done = false;
    msg.textContent = "Susun 1–15 berurutan.";
    scr.hideOverlay();
    render();
  }
  function render() {
    grid.innerHTML = "";
    tiles.forEach((v, i) => {
      grid.append(
        h("button", {
          class: "slide-tile" + (v ? "" : " blank"),
          type: "button",
          text: v ? String(v) : "",
          onclick: () => move(i),
        })
      );
    });
  }
  function move(i) {
    if (done) return;
    const blank = tiles.indexOf(0);
    const r1 = Math.floor(i / 4);
    const c1 = i % 4;
    const r2 = Math.floor(blank / 4);
    const c2 = blank % 4;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
    [tiles[i], tiles[blank]] = [tiles[blank], tiles[i]];
    moves++;
    sfx("click");
    render();
    if (tiles.every((v, k) => (k === 15 ? v === 0 : v === k + 1))) {
      done = true;
      sfx("win");
      scr.end({ score: moves, title: "Berhasil!", sub: `${moves} langkah`, retry: newGame });
    }
  }
  newGame();
  return { destroy: () => scr.destroy() };
}

/* ------------------------------ LIGHTS OUT ------------------------------- */
function lightsOut(ctx) {
  const { scr, wrap } = screen(ctx, "💡 Lights Out", "Matikan semua lampu", "min");
  const grid = h("div", { class: "lo-grid" });
  const msg = msgEl(wrap);
  wrap.append(grid);
  let on, moves, done;
  function newGame() {
    on = Array.from({ length: 25 }, () => false);
    moves = 0;
    done = false;
    const clicks = shuffle([...Array(25).keys()]).slice(0, 7);
    for (const i of clicks) toggle(i, false);
    if (on.every((v) => !v)) toggle(12, false);
    msg.textContent = "Tekan kotak untuk membalik lampu di sekitarnya.";
    scr.hideOverlay();
    render();
  }
  function toggle(i, sound = true) {
    const r = Math.floor(i / 5);
    const c = i % 5;
    for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < 5 && cc >= 0 && cc < 5) on[rr * 5 + cc] = !on[rr * 5 + cc];
    }
    if (sound) sfx("flip");
  }
  function render() {
    grid.innerHTML = "";
    on.forEach((v, i) =>
      grid.append(h("button", { class: "lo-cell" + (v ? " on" : ""), type: "button", onclick: () => click(i) }))
    );
  }
  function click(i) {
    if (done) return;
    toggle(i);
    moves++;
    render();
    if (on.every((v) => !v)) {
      done = true;
      sfx("win");
      scr.end({ score: moves, title: "Padam!", sub: `${moves} langkah`, retry: newGame });
    }
  }
  newGame();
  return { destroy: () => scr.destroy() };
}

/* -------------------------------- SOKOBAN -------------------------------- */
const SOKO_LEVELS = [
  ["######", "#    #", "# .$ #", "#  @ #", "#    #", "######"],
  ["#######", "#     #", "# .$. #", "#  @  #", "# .$. #", "#     #", "#######"],
  ["#######", "#     #", "# .$. #", "# .@. #", "#     #", "#######"],
];

function sokoban(ctx) {
  const { scr, wrap } = screen(ctx, "📦 Sokoban", "Dorong kotak ke titik tujuan", "min");
  const grid = h("div", { class: "sok-grid" });
  const pad = h("div", { class: "puz-pad" });
  const msg = msgEl(wrap);
  wrap.append(grid, pad);
  let level = 0;
  let map = [];
  let player = { r: 0, c: 0 };
  let boxes = [];
  let goals = [];
  let moves = 0;
  let done = false;

  for (const [label, key] of [["▲", "up"], ["◀", "left"], ["▼", "down"], ["▶", "right"]]) {
    pad.append(
      h("button", {
        class: "np-btn",
        type: "button",
        text: label,
        onclick: () => step(key),
      })
    );
  }

  function load(i) {
    level = i;
    map = SOKO_LEVELS[i].map((row) => row.split(""));
    boxes = [];
    goals = [];
    player = { r: 1, c: 1 };
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const ch = map[r][c];
        if (ch === "." || ch === "*" || ch === "+") goals.push(r + "," + c);
        if (ch === "$" || ch === "*") boxes.push(r + "," + c);
        if (ch === "@" || ch === "+") player = { r, c };
      }
    }
    moves = 0;
    done = false;
    msg.textContent = `Level ${i + 1} · ${boxes.length} kotak`;
    scr.hideOverlay();
    render();
  }

  function render() {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${map[0].length}, 1fr)`;
    for (let r = 0; r < map.length; r++) {
      for (let c = 0; c < map[r].length; c++) {
        const wall = map[r][c] === "#";
        const goal = goals.includes(r + "," + c);
        const box = boxes.includes(r + "," + c);
        const here = player.r === r && player.c === c;
        let cls = "sok-cell";
        if (wall) cls += " wall";
        if (goal) cls += " goal";
        let text = "";
        if (here) text = "🙂";
        else if (box) text = goal ? "✅" : "📦";
        else if (goal) text = "·";
        grid.append(h("div", { class: cls, text }));
      }
    }
  }

  function isWall(r, c) {
    return !map[r] || map[r][c] === undefined || map[r][c] === "#";
  }

  function step(dir) {
    if (done) return;
    const d = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[dir];
    const nr = player.r + d[0];
    const nc = player.c + d[1];
    if (isWall(nr, nc)) return;
    const key = nr + "," + nc;
    if (boxes.includes(key)) {
      const br = nr + d[0];
      const bc = nc + d[1];
      const bkey = br + "," + bc;
      if (isWall(br, bc) || boxes.includes(bkey)) return;
      boxes[boxes.indexOf(key)] = bkey;
      sfx("drop");
    } else {
      sfx("click");
    }
    player = { r: nr, c: nc };
    moves++;
    render();
    if (boxes.every((b) => goals.includes(b))) {
      sfx("win");
      if (level + 1 < SOKO_LEVELS.length) {
        msg.textContent = "Level selesai! Lanjut...";
        setTimeout(() => load(level + 1), 600);
      } else {
        done = true;
        scr.end({
          score: Math.max(1, moves),
          title: "Semua level selesai!",
          sub: `Total ${moves} langkah di level terakhir`,
          retry: () => load(0),
        });
      }
    }
  }

  const onKey = (e) => {
    const k = e.key;
    if (["ArrowUp", "w", "W"].includes(k)) step("up");
    else if (["ArrowDown", "s", "S"].includes(k)) step("down");
    else if (["ArrowLeft", "a", "A"].includes(k)) step("left");
    else if (["ArrowRight", "d", "D"].includes(k)) step("right");
    else return;
    e.preventDefault();
  };
  window.addEventListener("keydown", onKey);

  load(0);
  return {
    destroy() {
      window.removeEventListener("keydown", onKey);
      scr.destroy();
    },
  };
}

/* ------------------------------- NONOGRAM -------------------------------- */
function nonogram(ctx) {
  const { scr, wrap } = screen(ctx, "🟦 Nonogram", "Isi kotak sesuai petunjuk", "min");
  const grid = h("div", { class: "nonogram" });
  const msg = msgEl(wrap);
  wrap.append(grid);
  const tm = timer(wrap);
  let sol, board, done;

  function clues(line) {
    const out = [];
    let run = 0;
    for (const v of line) {
      if (v) run++;
      else if (run) {
        out.push(run);
        run = 0;
      }
    }
    if (run) out.push(run);
    return out.length ? out : [0];
  }

  function newGame() {
    sol = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => Math.random() < 0.5));
    board = Array.from({ length: 5 }, () => Array(5).fill(0));
    done = false;
    tm.start();
    msg.textContent = "Kotak: kosong → isi → tanda X.";
    scr.hideOverlay();
    render();
  }

  function render() {
    grid.innerHTML = "";
    grid.append(h("div", { class: "ng-corner" }));
    for (let c = 0; c < 5; c++) {
      const line = sol.map((row) => row[c]);
      grid.append(h("div", { class: "ng-clue", text: clues(line).join(" ") }));
    }
    for (let r = 0; r < 5; r++) {
      grid.append(h("div", { class: "ng-clue row", text: clues(sol[r]).join(" ") }));
      for (let c = 0; c < 5; c++) {
        const v = board[r][c];
        grid.append(
          h("button", {
            class: "ng-cell" + (v === 1 ? " fill" : v === 2 ? " mark" : ""),
            type: "button",
            text: v === 2 ? "×" : "",
            onclick: () => click(r, c),
          })
        );
      }
    }
  }

  function click(r, c) {
    if (done) return;
    board[r][c] = (board[r][c] + 1) % 3;
    sfx("click");
    render();
    let win = true;
    for (let r2 = 0; r2 < 5; r2++) for (let c2 = 0; c2 < 5; c2++) if ((board[r2][c2] === 1) !== sol[r2][c2]) win = false;
    if (win) {
      done = true;
      const secs = tm.stop();
      sfx("win");
      scr.end({ score: secs, title: "Benar!", sub: `${secs} detik`, retry: newGame });
    }
  }

  newGame();
  return {
    destroy() {
      tm.cancel();
      scr.destroy();
    },
  };
}

/* ------------------------------ MASTERMIND ------------------------------- */
function mastermind(ctx) {
  const { scr, wrap } = screen(ctx, "🧠 Mastermind", "Tebak 4 warna rahasia", "min");
  const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];
  const msg = msgEl(wrap);
  const slots = h("div", { class: "mm-slots" });
  const palette = h("div", { class: "mm-palette" });
  const history = h("div", { class: "mm-history" });
  const submit = h("button", { class: "btn primary", type: "button", text: "TEBAK" });
  wrap.append(slots, palette, submit, history);
  let secret, guess, tries, done;

  function newGame() {
    secret = Array.from({ length: 4 }, () => pick(COLORS));
    guess = [null, null, null, null];
    tries = 0;
    done = false;
    history.innerHTML = "";
    msg.textContent = "Pilih 4 warna. Umpan: ● tepat, ○ warna benar.";
    scr.hideOverlay();
    palette.innerHTML = "";
    COLORS.forEach((c) =>
      palette.append(
        h("button", {
          class: "mm-swatch " + c,
          type: "button",
          "aria-label": c,
          onclick: () => {
            const i = guess.indexOf(null);
            if (i >= 0 && !done) {
              guess[i] = c;
              sfx("click");
              render();
            }
          },
        })
      )
    );
    render();
  }

  function render() {
    slots.innerHTML = "";
    guess.forEach((c, i) =>
      slots.append(
        h("button", {
          class: "mm-slot" + (c ? " " + c : ""),
          type: "button",
          text: c ? "" : "?",
          onclick: () => {
            if (!done) {
              guess[i] = null;
              sfx("click");
              render();
            }
          },
        })
      )
    );
  }

  function submitGuess() {
    if (done || guess.some((c) => !c)) {
      msg.textContent = "Isi dulu 4 warna.";
      return;
    }
    tries++;
    const sec = secret.slice();
    const g = guess.slice();
    let exact = 0;
    let near = 0;
    for (let i = 0; i < 4; i++) {
      if (g[i] === sec[i]) {
        exact++;
        sec[i] = null;
        g[i] = "#";
      }
    }
    for (let i = 0; i < 4; i++) {
      if (g[i] === "#") continue;
      const idx = sec.indexOf(g[i]);
      if (idx >= 0) {
        near++;
        sec[idx] = null;
      }
    }
    const row = h("div", { class: "mm-row" });
    guess.forEach((c) => row.append(h("span", { class: "mm-dot " + c })));
    row.append(h("span", { class: "mm-fb", text: `${"●".repeat(exact)}${"○".repeat(near)}` }));
    history.prepend(row);
    if (exact === 4) {
      done = true;
      sfx("win");
      scr.end({ score: tries, title: "Pecah!", sub: `${tries} tebakan`, retry: newGame });
      return;
    }
    if (tries >= 8) {
      done = true;
      sfx("over");
      scr.end({
        score: tries,
        title: "Kalah",
        sub: `Rahasia: ${secret.map((c) => c[0].toUpperCase()).join(" ")}`,
        retry: newGame,
      });
      return;
    }
    guess = [null, null, null, null];
    sfx("tick");
    render();
    msg.textContent = `Tebakan ${tries}/8 — ● ${exact} tepat, ○ ${near} hampir.`;
  }

  submit.addEventListener("click", submitGuess);
  newGame();
  return { destroy: () => scr.destroy() };
}

/* ------------------------------ BULLS & COWS ----------------------------- */
function bullsCows(ctx) {
  const { scr, wrap } = screen(ctx, "🐂 Bulls & Cows", "Tebak 4 angka unik", "min");
  const msg = msgEl(wrap);
  const inputEl = h("div", { class: "bc-input", text: "____" });
  const pad = h("div", { class: "numpad" });
  const list = h("div", { class: "bc-list" });
  wrap.append(inputEl, pad, list);
  let secret, entry, tries, done;

  function newGame() {
    do {
      secret = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4);
    } while (secret[0] === 0 && Math.random() < 0.5);
    entry = "";
    tries = 0;
    done = false;
    list.innerHTML = "";
    msg.textContent = "Bulls = angka & posisi tepat. Cows = angka benar posisi salah.";
    scr.hideOverlay();
    pad.innerHTML = "";
    for (let d = 0; d <= 9; d++) {
      pad.append(h("button", { class: "np-btn", type: "button", text: String(d), onclick: () => add(d) }));
    }
    for (const [label, fn] of [
      ["⌫", () => { entry = entry.slice(0, -1); paint(); sfx("click"); }],
      ["OK", submit],
    ]) {
      pad.append(h("button", { class: "np-btn " + (label === "OK" ? "ok" : "clear"), type: "button", text: label, onclick: fn }));
    }
    paint();
  }

  function paint() {
    inputEl.textContent = (entry + "____").slice(0, 4).split("").map((ch) => (ch === "_" ? "·" : ch)).join(" ");
  }

  function add(d) {
    if (done || entry.length >= 4) return;
    if (entry.includes(String(d))) return;
    entry += String(d);
    sfx("click");
    paint();
    if (entry.length === 4) {
      // biarkan pemain tekan OK, tapi beri tanda
      inputEl.classList.add("ready");
    }
  }

  function submit() {
    if (done) return;
    if (entry.length !== 4) {
      msg.textContent = "Isi 4 angka dulu.";
      return;
    }
    tries++;
    let bulls = 0;
    let cows = 0;
    const used = [false, false, false, false];
    for (let i = 0; i < 4; i++) {
      if (Number(entry[i]) === secret[i]) {
        bulls++;
        used[i] = true;
      }
    }
    for (let i = 0; i < 4; i++) {
      if (Number(entry[i]) === secret[i]) continue;
      for (let j = 0; j < 4; j++) {
        if (!used[j] && Number(entry[i]) === secret[j]) {
          cows++;
          used[j] = true;
          break;
        }
      }
    }
    list.prepend(h("div", { class: "bc-row", text: `${entry} → ${bulls}🐂 ${cows}🐄` }));
    if (bulls === 4) {
      done = true;
      sfx("win");
      scr.end({ score: tries, title: "Tepat!", sub: `${tries} tebakan`, retry: newGame });
      return;
    }
    if (tries >= 10) {
      done = true;
      sfx("over");
      scr.end({ score: tries, title: "Habis", sub: `Jawaban: ${secret.join("")}`, retry: newGame });
      return;
    }
    entry = "";
    inputEl.classList.remove("ready");
    paint();
    sfx("tick");
    msg.textContent = `${bulls} bulls · ${cows} cows`;
  }

  newGame();
  return { destroy: () => scr.destroy() };
}

/* --------------------------------- WORDLE -------------------------------- */
const WORDS5 = [
  "apple","beach","brave","bread","brick","bring","brown","build","cabin","candy","chair","charm","chase","chess","chill",
  "cloud","clown","coast","crane","crazy","cream","dance","delta","dream","drink","eagle","earth","elbow","enjoy","fancy",
  "feast","field","flame","flash","fleet","flock","flour","focus","forest","frame","fresh","frost","fruit","ghost","giant",
  "globe","glory","grape","grass","green","group","guard","guest","happy","heart","honey","horse","house","jelly","jolly",
  "judge","juice","knife","laugh","lemon","light","lucky","magic","mango","maple","march","money","month","mount","mouse",
  "music","night","noble","north","ocean","olive","opera","orbit","paint","party","pasta","peace","peach","pearl","pilot",
  "pizza","plant","plaza","pound","power","pride","prize","queen","quick","quiet","radio","rainy","raven","reach","rider",
  "river","roast","robot","rocky","round","royal","salad","scale","scarf","scene","score","shape","sharp","sheep","shine",
  "shirt","shore","skate","skill","slate","smart","smile","smoke","snake","solar","sound","south","space","spark","spice",
  "spine","sport","stack","stand","star","steam","steel","stone","storm","sugar","sunny","sweet","swift","table","taste",
  "teach","tiger","toast","today","tower","track","trade","train","treat","trend","tribe","trust","tulip","uncle","under",
  "unity","upper","urban","value","vapor","vivid","voice","water","whale","wheat","wheel","white","witch","world","young",
];

function wordle(ctx) {
  const { scr, wrap } = screen(ctx, "🟩 Wordle", "Tebak kata 5 huruf dalam 6 percobaan", "min");
  const board = h("div", { class: "wordle-board" });
  const kb = h("div", { class: "kb" });
  const msg = msgEl(wrap);
  wrap.append(board, kb, msg);
  let answer, rows, current, done, guessNo;
  const keys = {};

  function newGame() {
    answer = pick(WORDS5);
    rows = Array.from({ length: 6 }, () => Array.from({ length: 5 }, () => ({ ch: "", state: "" })));
    current = "";
    done = false;
    guessNo = 0;
    msg.textContent = "Ketik kata, lalu Enter.";
    scr.hideOverlay();
    kb.innerHTML = "";
    for (const k of Object.keys(keys)) delete keys[k];
    const layout = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    layout.forEach((row, i) => {
      const r = h("div", { class: "kb-row" });
      if (i === 2) r.append(h("button", { class: "kb-key wide", type: "button", text: "↵", onclick: submit }));
      for (const ch of row) {
        const b = h("button", { class: "kb-key", type: "button", text: ch.toUpperCase(), onclick: () => type(ch) });
        keys[ch] = b;
        r.append(b);
      }
      if (i === 2) r.append(h("button", { class: "kb-key wide", type: "button", text: "⌫", onclick: back }));
      kb.append(r);
    });
    render();
  }

  function type(ch) {
    if (done || current.length >= 5) return;
    current += ch;
    sfx("click");
    render();
  }
  function back() {
    if (done) return;
    current = current.slice(0, -1);
    sfx("click");
    render();
  }

  function submit() {
    if (done) return;
    if (current.length !== 5) {
      msg.textContent = "Butuh 5 huruf.";
      return;
    }
    const guess = current;
    const res = Array(5).fill("");
    const left = answer.split("");
    for (let i = 0; i < 5; i++) {
      if (guess[i] === answer[i]) {
        res[i] = "hit";
        left[i] = null;
      }
    }
    for (let i = 0; i < 5; i++) {
      if (res[i]) continue;
      const idx = left.indexOf(guess[i]);
      if (idx >= 0) {
        res[i] = "near";
        left[idx] = null;
      } else res[i] = "miss";
    }
    for (let i = 0; i < 5; i++) rows[guessNo][i] = { ch: guess[i], state: res[i] };
    // keyboard hint
    for (let i = 0; i < 5; i++) {
      const ch = guess[i];
      const b = keys[ch];
      if (!b) continue;
      if (res[i] === "hit") b.className = "kb-key hit";
      else if (res[i] === "near" && b.className !== "kb-key hit") b.className = "kb-key near";
      else if (res[i] === "miss" && !b.className.includes("hit") && !b.className.includes("near")) b.className = "kb-key miss";
    }
    guessNo++;
    current = "";
    sfx(res.every((x) => x === "hit") ? "win" : "tick");
    render();
    if (guess === answer) {
      done = true;
      scr.end({ score: guessNo, title: "Benar!", sub: `${guessNo} tebakan`, retry: newGame });
    } else if (guessNo >= 6) {
      done = true;
      scr.end({ score: guessNo, title: "Kalah", sub: `Jawaban: ${answer.toUpperCase()}`, retry: newGame });
    }
  }

  function render() {
    board.innerHTML = "";
    rows.forEach((row, r) => {
      const line = h("div", { class: "wordle-row" });
      row.forEach((cell, c) => {
        const ch = r === guessNo ? current[c] || "" : cell.ch;
        const state = r === guessNo ? "" : cell.state;
        line.append(h("div", { class: `wordle-cell ${state}` + (ch ? " filled" : "") , text: ch.toUpperCase() }));
      });
      board.append(line);
    });
  }

  const onKey = (e) => {
    if (done) return;
    if (e.key === "Enter") submit();
    else if (e.key === "Backspace") back();
    else if (/^[a-zA-Z]$/.test(e.key)) type(e.key.toLowerCase());
  };
  window.addEventListener("keydown", onKey);

  newGame();
  return {
    destroy() {
      window.removeEventListener("keydown", onKey);
      scr.destroy();
    },
  };
}

/* -------------------------------- HANGMAN -------------------------------- */
const HANG_WORDS = [
  ["komputer", "Alat elektronik untuk mengolah data"],
  ["gajah", "Hewan besar berbelalai"],
  ["pelangi", "Busur warna di langit"],
  ["jakarta", "Ibu kota Indonesia"],
  ["kopi", "Minuman hitam berkafein"],
  ["gunung", "Daratan yang sangat tinggi"],
  ["sepeda", "Kendaraan beroda dua"],
  ["bintang", "Cahaya di langit malam"],
  ["pisang", "Buah kuning melengkung"],
  ["matahari", "Pusat tata surya"],
  ["pulau", "Daratan dikelilingi air"],
  ["dokter", "Profesi penyembuh"],
  ["buku", "Kumpulan halaman berisi tulisan"],
  ["hujan", "Air jatuh dari langit"],
  ["kucing", "Hewan berbulu yang mengeong"],
  ["sepatu", "Dipakai di kaki"],
  ["pantai", "Tepi laut berpasir"],
  ["nasi", "Makanan pokok orang Indonesia"],
];
const ALPHA = "abcdefghijklmnopqrstuvwxyz".split("");

function hangman(ctx) {
  const { scr, wrap } = screen(ctx, "🪢 Hangman", "Tebak kata sebelum nyawa habis", "max");
  const msg = msgEl(wrap);
  const wordEl = h("div", { class: "hang-word" });
  const livesEl = h("div", { class: "hang-lives" });
  const kb = h("div", { class: "kb" });
  wrap.append(livesEl, wordEl, kb);
  let word, clue, guessed, wrong, done;

  function newGame() {
    [word, clue] = pick(HANG_WORDS);
    guessed = new Set();
    wrong = 0;
    done = false;
    msg.textContent = `Petunjuk: ${clue}`;
    scr.hideOverlay();
    kb.innerHTML = "";
    for (let r = 0; r < 3; r++) {
      const row = h("div", { class: "kb-row" });
      for (const ch of ALPHA.slice(r * 9, r * 9 + 9)) {
        row.append(h("button", { class: "kb-key", type: "button", text: ch.toUpperCase(), onclick: () => guess(ch) }));
      }
      kb.append(row);
    }
    render();
  }

  function render() {
    wordEl.innerHTML = "";
    for (const ch of word) {
      wordEl.append(h("span", { class: "hang-letter" + (guessed.has(ch) ? " open" : ""), text: guessed.has(ch) ? ch.toUpperCase() : "" }));
    }
    livesEl.innerHTML = "";
    for (let i = 0; i < 6; i++) livesEl.append(h("span", { class: "hang-life" + (i < 6 - wrong ? " ok" : ""), text: "♥" }));
  }

  function guess(ch) {
    if (done || guessed.has(ch)) return;
    guessed.add(ch);
    if (!word.includes(ch)) {
      wrong++;
      sfx("hit");
    } else sfx("flip");
    render();
    if (word.split("").every((c) => guessed.has(c))) {
      done = true;
      sfx("win");
      scr.end({ score: 6 - wrong, title: "Berhasil!", sub: `${word.toUpperCase()} · sisa ${6 - wrong} nyawa`, retry: newGame });
    } else if (wrong >= 6) {
      done = true;
      sfx("over");
      scr.end({ score: 1, title: "Kalah", sub: `Jawaban: ${word.toUpperCase()}`, retry: newGame });
    }
  }

  newGame();
  return { destroy: () => scr.destroy() };
}

/* -------------------------------- ANAGRAM -------------------------------- */
const ANA_WORDS = [
  ["sekolah", "Tempat belajar"],
  ["matahari", "Bintang tata surya"],
  ["komputer", "Mesin pengolah data"],
  ["indonesia", "Negara tempat kita tinggal"],
  ["sepakbola", "Olahraga dengan bola dan gawang"],
  ["perpustakaan", "Tempat penuh buku"],
  ["gunungapi", "Gunung yang bisa meletus"],
  ["kucing", "Hewan mengeong"],
  ["pisang", "Buah kuning"],
  ["sepeda", "Kendaraan roda dua"],
  ["pelangi", "Warna-warni di langit"],
  ["jakarta", "Ibu kota"],
];

function anagram(ctx) {
  const { scr, wrap } = screen(ctx, "🔀 Anagram", "Susun ulang huruf jadi kata", "min");
  const msg = msgEl(wrap);
  const clueEl = h("p", { class: "puz-clue", text: "" });
  const tiles = h("div", { class: "letter-tiles" });
  const input = h("input", { class: "puz-input", type: "text", autocomplete: "off", spellcheck: "false", placeholder: "jawaban..." });
  const btn = h("button", { class: "btn primary", type: "button", text: "PERIKSA" });
  wrap.append(clueEl, tiles, input, btn);
  const tm = timer(wrap);
  let word, done;

  function newGame() {
    tm.cancel();
    [word] = pick(ANA_WORDS);
    done = false;
    clueEl.textContent = "Petunjuk: " + ANA_WORDS.find((w) => w[0] === word)[1];
    const letters = shuffle(word.split(""));
    tiles.innerHTML = "";
    letters.forEach((ch) => tiles.append(h("span", { class: "letter-tile", text: ch.toUpperCase() })));
    input.value = "";
    msg.textContent = "";
    scr.hideOverlay();
    tm.start();
  }

  function check() {
    if (done) return;
    const val = input.value.trim().toLowerCase();
    if (!val) return;
    if (val === word) {
      done = true;
      const secs = tm.stop();
      sfx("win");
      scr.end({ score: secs, title: "Benar!", sub: `${word.toUpperCase()} · ${secs} detik`, retry: newGame });
    } else {
      msg.textContent = "Belum tepat, coba lagi.";
      sfx("hit");
      input.value = "";
    }
  }

  btn.addEventListener("click", check);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") check();
  });
  newGame();
  return {
    destroy() {
      tm.cancel();
      scr.destroy();
    },
  };
}

/* ------------------------------ WORD SEARCH ------------------------------ */
const WS_WORDS = ["KUCING", "RUMAH", "BUKU", "PELANGI", "SEPEDA"];
const WS_SIZE = 8;

function wordSearch(ctx) {
  const { scr, wrap } = screen(ctx, "🔎 Word Search", "Temukan 5 kata tersembunyi", "max");
  const msg = msgEl(wrap);
  const grid = h("div", { class: "ws-grid" });
  const list = h("div", { class: "ws-list" });
  wrap.append(list, grid);
  let cells, found, selected, done;
  const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  function newGame() {
    const g = Array.from({ length: WS_SIZE }, () => Array.from({ length: WS_SIZE }, () => pick(alpha.split(""))));
    const used = Array.from({ length: WS_SIZE }, () => Array(WS_SIZE).fill(false));
    for (const word of WS_WORDS) {
      const opts = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      outer: for (let tries = 0; tries < 300; tries++) {
        const dir = pick(opts);
        const r0 = randInt(0, WS_SIZE - 1);
        const c0 = randInt(0, WS_SIZE - 1);
        const r1 = r0 + dir[0] * (word.length - 1);
        const c1 = c0 + dir[1] * (word.length - 1);
        if (r1 < 0 || r1 >= WS_SIZE || c1 < 0 || c1 >= WS_SIZE) continue;
        for (let i = 0; i < word.length; i++) {
          const rr = r0 + dir[0] * i;
          const cc = c0 + dir[1] * i;
          if (used[rr][cc] && g[rr][cc] !== word[i]) continue outer;
        }
        for (let i = 0; i < word.length; i++) {
          const rr = r0 + dir[0] * i;
          const cc = c0 + dir[1] * i;
          g[rr][cc] = word[i];
          used[rr][cc] = true;
        }
        break;
      }
    }
    cells = g;
    found = new Set();
    selected = [];
    done = false;
    msg.textContent = "Ketuk huruf awal lalu huruf akhir.";
    scr.hideOverlay();
    list.innerHTML = "";
    WS_WORDS.forEach((w) => list.append(h("span", { class: "ws-word", "data-w": w, text: w })));
    render();
  }

  function render() {
    grid.innerHTML = "";
    for (let r = 0; r < WS_SIZE; r++) {
      for (let c = 0; c < WS_SIZE; c++) {
        const key = r + "," + c;
        const isSel = selected.includes(key);
        const isFound = [...found].some((w) => w.cells.includes(key));
        grid.append(
          h("button", {
            class: "ws-cell" + (isSel ? " sel" : "") + (isFound ? " found" : ""),
            type: "button",
            text: cells[r][c],
            onclick: () => tapCell(r, c),
          })
        );
      }
    }
    list.querySelectorAll(".ws-word").forEach((el) => {
      el.classList.toggle("done", found.has(el.dataset.w) || [...found].some((w) => w.word === el.dataset.w));
    });
  }

  function lineCells(a, b) {
    const [r1, c1] = a.split(",").map(Number);
    const [r2, c2] = b.split(",").map(Number);
    const dr = Math.sign(r2 - r1);
    const dc = Math.sign(c2 - c1);
    if (!(r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1))) return null;
    const len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1)) + 1;
    const out = [];
    for (let i = 0; i < len; i++) out.push((r1 + dr * i) + "," + (c1 + dc * i));
    return out;
  }

  function tapCell(r, c) {
    if (done) return;
    const key = r + "," + c;
    if (!selected.length) {
      selected = [key];
      render();
      sfx("click");
      return;
    }
    if (selected.length === 1) {
      if (selected[0] === key) {
        selected = [];
        render();
        return;
      }
      const cellsLine = lineCells(selected[0], key);
      if (!cellsLine) {
        selected = [key];
        render();
        return;
      }
      const str = cellsLine.map((k) => {
        const [rr, cc] = k.split(",").map(Number);
        return cells[rr][cc];
      }).join("");
      const rev = str.split("").reverse().join("");
      const match = WS_WORDS.find((w) => (w === str || w === rev) && ![...found].some((f) => f.word === w));
      selected = [];
      if (match) {
        found.add({ word: match, cells: cellsLine });
        sfx("point");
        msg.textContent = `${match} ditemukan!`;
        if (found.size === WS_WORDS.length) {
          done = true;
          sfx("win");
          scr.setScore(WS_WORDS.length);
          scr.end({ score: WS_WORDS.length, title: "Semua ketemu!", sub: "5/5 kata", retry: newGame });
        }
      } else {
        msg.textContent = "Bukan kata dalam daftar.";
        sfx("tick");
      }
      render();
    }
  }

  newGame();
  return { destroy: () => scr.destroy() };
}

export const puzzles1 = [
  { id: "sudoku", name: "Sudoku", emoji: "🔢", tag: "Puzzle", desc: "Sudoku 9×9 klasik, tanpa duplikat.", bestMode: "min", mount: (ctx) => sudokuGame(ctx, 9, "Sudoku", "🔢", "", 45) },
  { id: "sudoku-mini", name: "Sudoku Mini", emoji: "4️⃣", tag: "Puzzle", desc: "Sudoku 4×4 untuk pemanasan.", bestMode: "min", mount: (ctx) => sudokuGame(ctx, 4, "Sudoku Mini", "4️⃣", "", 8) },
  { id: "fifteen-puzzle", name: "Fifteen", emoji: "🧩", tag: "Puzzle", desc: "Geser angka 1–15 ke urutan benar.", bestMode: "min", mount: fifteen },
  { id: "lights-out", name: "Lights Out", emoji: "💡", tag: "Puzzle", desc: "Matikan semua lampu dengan pola tekan.", bestMode: "min", mount: lightsOut },
  { id: "sokoban", name: "Sokoban", emoji: "📦", tag: "Puzzle", desc: "Dorong kotak ke titik tujuan, 3 level.", bestMode: "min", mount: sokoban },
  { id: "nonogram", name: "Nonogram", emoji: "🟦", tag: "Puzzle", desc: "Isi grid sesuai petunjuk baris & kolom.", bestMode: "min", mount: nonogram },
  { id: "mastermind", name: "Mastermind", emoji: "🧠", tag: "Puzzle", desc: "Tebak 4 warna rahasia dengan umpan.", bestMode: "min", mount: mastermind },
  { id: "bulls-cows", name: "Bulls & Cows", emoji: "🐂", tag: "Puzzle", desc: "Tebak 4 angka unik dari petunjuk.", bestMode: "min", mount: bullsCows },
  { id: "wordle", name: "Wordle", emoji: "🟩", tag: "Word", desc: "Tebak kata 5 huruf dalam 6 kali.", bestMode: "min", mount: wordle },
  { id: "hangman", name: "Hangman", emoji: "🪢", tag: "Word", desc: "Tebak kata sebelum 6 nyawa habis.", bestMode: "max", mount: hangman },
  { id: "anagram", name: "Anagram", emoji: "🔀", tag: "Word", desc: "Susun huruf acak menjadi kata.", bestMode: "min", mount: anagram },
  { id: "word-search", name: "Word Search", emoji: "🔎", tag: "Word", desc: "Cari 5 kata di grid huruf.", bestMode: "max", mount: wordSearch },
];
