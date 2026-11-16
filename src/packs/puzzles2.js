// Pack puzzle grid & logika (bagian 2). 10 game.
import { createScreen, createStage, h, clamp, rand, randInt, pick, shuffle, sfx, roundRect } from "../lib/kit.js";

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

function msgEl(wrap) {
  const el = h("p", { class: "puz-msg", text: "" });
  wrap.append(el);
  return el;
}

/* -------------------------------- 2048 ---------------------------------- */
function game2048(ctx, n, title, emoji, desc) {
  const { scr, wrap } = screen(ctx, `${emoji} ${title}`, "Geser / panah untuk gabungkan angka", "max");
  const grid = h("div", { class: "g2048" });
  grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  const msg = msgEl(wrap);
  wrap.append(grid);
  let board, score, done;

  const COLORS = {
    2: ["#1e293b", "#e2e8f0"],
    4: ["#334155", "#f1f5f9"],
    8: ["#0e7490", "#ecfeff"],
    16: ["#0d9488", "#f0fdfa"],
    32: ["#16a34a", "#f0fdf4"],
    64: ["#65a30d", "#fefce8"],
    128: ["#ca8a04", "#fffbeb"],
    256: ["#ea580c", "#fff7ed"],
    512: ["#dc2626", "#fef2f2"],
    1024: ["#be185d", "#fdf2f8"],
    2048: ["#7c3aed", "#f5f3ff"],
  };

  function newGame() {
    board = Array.from({ length: n }, () => Array(n).fill(0));
    score = 0;
    done = false;
    addTile();
    addTile();
    msg.textContent = `Gabungkan angka sampai 2048.`;
    scr.setScore(0);
    scr.hideOverlay();
    render();
  }

  function addTile() {
    const empty = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (!board[r][c]) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = pick(empty);
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function slideLine(line) {
    const arr = line.filter((v) => v);
    const out = [];
    let gain = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === arr[i + 1]) {
        const v = arr[i] * 2;
        out.push(v);
        gain += v;
        i++;
      } else out.push(arr[i]);
    }
    while (out.length < n) out.push(0);
    return { out, gain };
  }

  function move(dir) {
    if (done) return;
    let changed = false;
    let gain = 0;
    const lines = [];
    if (dir === "left" || dir === "right") {
      for (let r = 0; r < n; r++) {
        const line = board[r].slice();
        const rev = dir === "right";
        const res = slideLine(rev ? line.reverse() : line);
        const out = rev ? res.out.reverse() : res.out;
        if (out.some((v, i) => v !== board[r][i])) changed = true;
        gain += res.gain;
        lines.push({ type: "row", idx: r, out });
      }
    } else {
      for (let c = 0; c < n; c++) {
        const line = board.map((row) => row[c]);
        const rev = dir === "down";
        const res = slideLine(rev ? line.reverse() : line);
        const out = rev ? res.out.reverse() : res.out;
        if (out.some((v, i) => v !== board[i][c])) changed = true;
        gain += res.gain;
        lines.push({ type: "col", idx: c, out });
      }
    }
    if (!changed) {
      sfx("tick");
      return;
    }
    for (const ln of lines) {
      if (ln.type === "row") board[ln.idx] = ln.out;
      else ln.out.forEach((v, r) => (board[r][ln.idx] = v));
    }
    score += gain;
    scr.setScore(score);
    addTile();
    render();
    sfx(gain > 0 ? "point" : "flip");
    if (board.some((row) => row.some((v) => v >= 2048))) {
      done = true;
      sfx("win");
      scr.end({ score, title: "2048!", sub: `Skor ${score}`, retry: newGame });
      return;
    }
    if (!hasMoves()) {
      done = true;
      sfx("over");
      scr.end({ score, title: "Tidak ada langkah", sub: `Skor ${score}`, retry: newGame });
    }
  }

  function hasMoves() {
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!board[r][c]) return true;
      if (r + 1 < n && board[r][c] === board[r + 1][c]) return true;
      if (c + 1 < n && board[r][c] === board[r][c + 1]) return true;
    }
    return false;
  }

  function render() {
    grid.innerHTML = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = board[r][c];
        const [bg, fg] = COLORS[v] || ["#4c1d95", "#f5f3ff"];
        const el = h("div", {
          class: "g-cell" + (v ? " filled" : ""),
          text: v ? String(v) : "",
          style: { background: v ? bg : "rgba(148,163,184,0.1)", color: fg, fontSize: v >= 1000 ? "13px" : v >= 100 ? "15px" : "18px" },
        });
        grid.append(el);
      }
    }
  }

  const onKey = (e) => {
    const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
    if (map[e.key]) {
      e.preventDefault();
      move(map[e.key]);
    }
  };
  window.addEventListener("keydown", onKey);

  let sx = 0;
  let sy = 0;
  let swiping = false;
  grid.addEventListener("pointerdown", (e) => {
    sx = e.clientX;
    sy = e.clientY;
    swiping = true;
  });
  grid.addEventListener("pointerup", (e) => {
    if (!swiping) return;
    swiping = false;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.hypot(dx, dy) < 22) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  });

  newGame();
  return {
    destroy() {
      window.removeEventListener("keydown", onKey);
      scr.destroy();
    },
  };
}

/* ------------------------------ PIPE CONNECT ----------------------------- */
const N = 1;
const E = 2;
const S = 4;
const W = 8;
const DIRS = [
  [N, -1, 0],
  [E, 0, 1],
  [S, 1, 0],
  [W, 0, -1],
];
const OPP = { [N]: S, [E]: W, [S]: N, [W]: E };

function rotateMask(mask) {
  let out = 0;
  if (mask & N) out |= E;
  if (mask & E) out |= S;
  if (mask & S) out |= W;
  if (mask & W) out |= N;
  return out;
}

function pipeConnect(ctx) {
  const { scr, wrap } = screen(ctx, "🔧 Pipe Connect", "Putar pipa sampai air mengalir", "min");
  const size = 5;
  const grid = h("div", { class: "pipe-grid" });
  grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  const msg = msgEl(wrap);
  wrap.append(grid);
  let masks, moves, done;

  function newGame() {
    masks = Array.from({ length: size }, () => Array(size).fill(0));
    const path = [];
    const seen = new Set();
    const dfs = (r, c) => {
      path.push([r, c]);
      seen.add(r + "," + c);
      if (r === size - 1 && c === size - 1) return true;
      const dirs = shuffle([[-1, 0], [1, 0], [0, -1], [0, 1]]);
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size || seen.has(nr + "," + nc)) continue;
        if (dfs(nr, nc)) return true;
      }
      path.pop();
      return false;
    };
    dfs(0, 0);
    for (let i = 0; i < path.length; i++) {
      const [r, c] = path[i];
      let mask = 0;
      const prev = path[i - 1];
      const next = path[i + 1];
      for (const nb of [prev, next]) {
        if (!nb) continue;
        const dr = nb[0] - r;
        const dc = nb[1] - c;
        if (dr === -1) mask |= N;
        if (dr === 1) mask |= S;
        if (dc === 1) mask |= E;
        if (dc === -1) mask |= W;
      }
      masks[r][c] = mask;
    }
    const shapes = [N | S, E | W, N | E, E | S, S | W, W | N, N | E | S, E | S | W, S | W | N, W | N | E];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!masks[r][c]) masks[r][c] = pick(shapes);
        const turns = randInt(0, 3);
        for (let k = 0; k < turns; k++) masks[r][c] = rotateMask(masks[r][c]);
      }
    }
    moves = 0;
    done = false;
    msg.textContent = "Putar pipa. Sambungkan IN ke OUT.";
    scr.hideOverlay();
    render();
  }

  function connected() {
    const seen = new Set(["0,0"]);
    const q = [[0, 0]];
    while (q.length) {
      const [r, c] = q.shift();
      const mask = masks[r][c];
      for (const [bit, dr, dc] of DIRS) {
        if (!(mask & bit)) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (!(masks[nr][nc] & OPP[bit])) continue;
        const key = nr + "," + nc;
        if (seen.has(key)) continue;
        seen.add(key);
        q.push([nr, nc]);
      }
    }
    return seen.has(size - 1 + "," + (size - 1));
  }

  function render() {
    grid.innerHTML = "";
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const mask = masks[r][c];
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("viewBox", "0 0 32 32");
        svg.setAttribute("class", "pipe-svg");
        const mk = (x1, y1, x2, y2) => {
          const ln = document.createElementNS(ns, "line");
          ln.setAttribute("x1", x1);
          ln.setAttribute("y1", y1);
          ln.setAttribute("x2", x2);
          ln.setAttribute("y2", y2);
          svg.append(ln);
        };
        if (mask & N) mk(16, 16, 16, 0);
        if (mask & E) mk(16, 16, 32, 16);
        if (mask & S) mk(16, 16, 16, 32);
        if (mask & W) mk(16, 16, 0, 16);
        const center = document.createElementNS(ns, "circle");
        center.setAttribute("cx", 16);
        center.setAttribute("cy", 16);
        center.setAttribute("r", 5);
        svg.append(center);
        const cls = "pipe-cell" + (r === 0 && c === 0 ? " in" : "") + (r === size - 1 && c === size - 1 ? " out" : "");
        grid.append(
          h("button", {
            class: cls,
            type: "button",
            onclick: () => turn(r, c),
          }, [svg, r === 0 && c === 0 ? h("span", { class: "pipe-tag", text: "IN" }) : null, r === size - 1 && c === size - 1 ? h("span", { class: "pipe-tag", text: "OUT" }) : null])
        );
      }
    }
  }

  function turn(r, c) {
    if (done) return;
    masks[r][c] = rotateMask(masks[r][c]);
    moves++;
    sfx("click");
    render();
    if (connected()) {
      done = true;
      sfx("win");
      scr.end({ score: Math.max(1, moves), title: "Tersambung!", sub: `Air mengalir · ${moves} putaran`, retry: newGame });
    }
  }

  newGame();
  return { destroy: () => scr.destroy() };
}

/* ------------------------------- COLOR SORT ------------------------------ */
function colorSort(ctx) {
  const { scr, wrap } = screen(ctx, "🌈 Color Sort", "Pindahkan warna sampai satu tabung", "min");
  const tubesEl = h("div", { class: "tubes" });
  const msg = msgEl(wrap);
  wrap.append(tubesEl);
  const COLORS = 5;
  const CAP = 4;
  let tubes, selected, moves, done;

  function newGame() {
    const pool = [];
    for (let c = 0; c < COLORS; c++) for (let i = 0; i < CAP; i++) pool.push(c);
    let shuffled;
    do {
      shuffled = shuffle(pool);
      tubes = [];
      for (let i = 0; i < COLORS; i++) tubes.push(shuffled.slice(i * CAP, i * CAP + CAP));
      tubes.push([], []);
    } while (tubes.slice(0, COLORS).every((t) => t.length === CAP && t.every((c) => c === t[0])));
    selected = null;
    moves = 0;
    done = false;
    msg.textContent = "Ketuk tabung sumber, lalu tabung tujuan.";
    scr.hideOverlay();
    render();
  }

  function render() {
    tubesEl.innerHTML = "";
    tubes.forEach((t, i) => {
      const tube = h("button", {
        class: "tube" + (selected === i ? " sel" : ""),
        type: "button",
        onclick: () => tap(i),
      });
      for (let k = 0; k < CAP; k++) {
        const v = t[k];
        tube.append(h("span", { class: "seg" + (v === undefined ? " empty" : " c" + v) }));
      }
      tubesEl.append(tube);
    });
  }

  function tap(i) {
    if (done) return;
    if (selected === null) {
      if (!tubes[i].length) return;
      if (tubes[i].length === CAP && tubes[i].every((c) => c === tubes[i][0])) return;
      selected = i;
      sfx("click");
      render();
      return;
    }
    if (selected === i) {
      selected = null;
      render();
      return;
    }
    const src = tubes[selected].slice();
    const dst = tubes[i].slice();
    const color = src[src.length - 1];
    let run = 1;
    while (run < src.length && src[src.length - 1 - run] === color) run++;
    if (dst.length === CAP || (dst.length && dst[dst.length - 1] !== color)) {
      selected = i;
      sfx("tick");
      render();
      return;
    }
    const space = CAP - dst.length;
    const moveN = Math.min(run, space);
    for (let k = 0; k < moveN; k++) {
      src.pop();
      dst.push(color);
    }
    tubes[selected] = src;
    tubes[i] = dst;
    moves++;
    selected = null;
    sfx("drop");
    render();
    if (tubes.every((t) => !t.length || (t.length === CAP && t.every((c) => c === t[0])))) {
      done = true;
      sfx("win");
      scr.end({ score: Math.max(1, moves), title: "Rapi!", sub: `${moves} langkah`, retry: newGame });
    }
  }

  newGame();
  return { destroy: () => scr.destroy() };
}

/* -------------------------------- MAZE ----------------------------------- */
function mazeEscape(ctx) {
  const st = createStage(ctx.root, {
    w: 320,
    h: 400,
    title: "🌀 Maze Escape",
    subtitle: "Cari jalan keluar dari labirin",
    best: ctx.best,
    onBest: ctx.report,
  });
  const g = st.ctx;
  const W = st.w;
  const H = st.h;
  const S = 15;
  const cell = W / S;
  let maze, px, py, steps, done, t;
  const padTop = 8;

  function carve(r, c) {
    maze[r * S + c] = 1;
    const dirs = shuffle([[-2, 0], [2, 0], [0, -2], [0, 2]]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 1 || nr >= S - 1 || nc < 1 || nc >= S - 1 || maze[nr * S + nc]) continue;
      maze[(r + dr / 2) * S + (c + dc / 2)] = 1;
      carve(nr, nc);
    }
  }

  function newGame() {
    maze = Array(S * S).fill(0);
    carve(1, 1);
    px = 1;
    py = 1;
    steps = 0;
    done = false;
    t = 0;
    st.hideOverlay();
    st.setScore(0);
  }

  st.pad(["up", "left", "down", "right"]);

  function step(dir) {
    if (done) return;
    const d = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[dir];
    const nr = py + d[0];
    const nc = px + d[1];
    if (nr < 0 || nr >= S || nc < 0 || nc >= S) return;
    if (!maze[nr * S + nc]) return;
    py = nr;
    px = nc;
    steps++;
    st.setScore(steps);
    sfx("click");
    if (px === S - 2 && py === S - 2) {
      done = true;
      sfx("win");
      st.end({ score: Math.max(1, steps), title: "Keluar!", sub: `${steps} langkah`, retry: newGame });
    }
  }

  st.onKeyDown((k) => {
    if (["up", "down", "left", "right"].includes(k)) step(k);
  });
  st.onSwipe((dir) => step(dir));

  function render() {
    g.fillStyle = "#070a12";
    g.fillRect(0, 0, W, H);
    const top = padTop;
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        const x = c * cell;
        const y = top + r * cell;
        if (maze[r * S + c]) {
          g.fillStyle = "rgba(78,225,255,0.14)";
          g.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        } else {
          g.fillStyle = "rgba(167,139,250,0.55)";
          g.fillRect(x, y, cell, cell);
        }
      }
    }
    // exit
    g.fillStyle = "#a3e635";
    g.shadowBlur = 10;
    g.shadowColor = "#a3e635";
    g.beginPath();
    g.arc((S - 2) * cell + cell / 2, top + (S - 2) * cell + cell / 2, cell * 0.36, 0, Math.PI * 2);
    g.fill();
    // player
    g.fillStyle = "#ff6bd6";
    g.shadowColor = "#ff6bd6";
    g.beginPath();
    g.arc(px * cell + cell / 2, top + py * cell + cell / 2, cell * 0.4, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
    g.fillStyle = "rgba(231,236,247,0.8)";
    g.font = "700 11px ui-monospace, monospace";
    g.textAlign = "left";
    g.fillText(`${steps} langkah`, 10, 20);
    g.textAlign = "right";
    g.fillText("EXIT →", W - 10, 20);
  }

  st.loop((dt) => {
    t += dt;
    render();
  });
  newGame();
  return { destroy: st.destroy };
}

/* ------------------------------ TOWER HANOI ------------------------------ */
function hanoi(ctx) {
  const { scr, wrap } = screen(ctx, "🗼 Tower of Hanoi", "Pindahkan semua cakram ke tiang kanan", "min");
  const pegsEl = h("div", { class: "hanoi" });
  const msg = msgEl(wrap);
  wrap.append(pegsEl);
  let pegs, selected, moves, done;
  const DISKS = 4;

  function newGame() {
    pegs = [[4, 3, 2, 1], [], []];
    selected = null;
    moves = 0;
    done = false;
    msg.textContent = "Ketuk tiang untuk ambil, ketuk tiang lain untuk taruh.";
    scr.hideOverlay();
    render();
  }

  function render() {
    pegsEl.innerHTML = "";
    pegs.forEach((peg, i) => {
      const col = h("button", { class: "hanoi-peg" + (selected === i ? " sel" : ""), type: "button", onclick: () => tap(i) });
      const stack = h("div", { class: "hanoi-stack" });
      for (let k = DISKS - 1; k >= 0; k--) {
        const d = peg[k];
        stack.append(
          h("div", {
            class: "disk" + (d ? " d" + d : " none"),
            style: { width: d ? `${18 + d * 14}%` : "0%" },
          })
        );
      }
      col.append(stack, h("span", { class: "hanoi-base", text: "▲" }));
      pegsEl.append(col);
    });
  }

  function tap(i) {
    if (done) return;
    if (selected === null) {
      if (!pegs[i].length) return;
      selected = i;
      sfx("click");
      render();
      return;
    }
    if (selected === i) {
      selected = null;
      render();
      return;
    }
    const from = pegs[selected];
    const to = pegs[i];
    const disk = from[from.length - 1];
    if (to.length && to[to.length - 1] < disk) {
      msg.textContent = "Cakram lebih besar tidak boleh di atas yang kecil.";
      sfx("hit");
      selected = i;
      render();
      return;
    }
    from.pop();
    to.push(disk);
    moves++;
    selected = null;
    sfx("drop");
    render();
    if (pegs[2].length === DISKS) {
      done = true;
      sfx("win");
      scr.end({ score: Math.max(1, moves), title: "Selesai!", sub: `${moves} langkah (optimal 15)`, retry: newGame });
    }
  }

  newGame();
  return { destroy: () => scr.destroy() };
}

/* --------------------------------- NIM ----------------------------------- */
function nim(ctx) {
  const { scr, wrap } = screen(ctx, "🎯 Nim", "Ambil bola terakhir untuk menang", "max");
  const pilesEl = h("div", { class: "nim-piles" });
  const msg = msgEl(wrap);
  wrap.append(pilesEl);
  let piles, streak, busy, done;
  const timers = [];

  function newGame(resetStreak = true) {
    piles = [3, 4, 5];
    busy = false;
    done = false;
    if (resetStreak) streak = 0;
    msg.textContent = `Streak menang: ${streak}. Giliranmu.`;
    scr.hideOverlay();
    render();
  }

  function render() {
    pilesEl.innerHTML = "";
    piles.forEach((count, i) => {
      const row = h("div", { class: "nim-row" });
      for (let k = 0; k < count; k++) {
        row.append(h("button", { class: "nim-dot", type: "button", onclick: () => take(i, k) }));
      }
      pilesEl.append(row);
    });
  }

  function finishRound(playerWon) {
    done = true;
    busy = true;
    if (playerWon) {
      streak++;
      scr.setScore(streak);
      msg.textContent = `Menang! Streak ${streak}`;
      sfx("win");
      const id = setTimeout(() => newGame(false), 900);
      timers.push(id);
    } else {
      sfx("over");
      scr.setScore(streak);
      scr.end({ score: streak, title: "Kalah", sub: `Streak ${streak}`, retry: () => newGame(true) });
    }
  }

  function take(i, k) {
    if (busy || done) return;
    // ambil dari k sampai ujung
    const takeN = piles[i] - k;
    if (takeN <= 0) return;
    piles[i] -= takeN;
    sfx("drop");
    render();
    if (piles.every((p) => p === 0)) {
      finishRound(true);
      return;
    }
    busy = true;
    msg.textContent = "Komputer berpikir...";
    const id = setTimeout(cpu, 550);
    timers.push(id);
  }

  function cpu() {
    const nimSum = piles.reduce((a, b) => a ^ b, 0);
    let chosen = -1;
    let takeN = 1;
    if (nimSum !== 0) {
      for (let i = 0; i < piles.length; i++) {
        const target = piles[i] ^ nimSum;
        if (target < piles[i]) {
          chosen = i;
          takeN = piles[i] - target;
          break;
        }
      }
    }
    if (chosen < 0) {
      chosen = piles.findIndex((p) => p > 0);
      takeN = 1;
    }
    if (chosen < 0) return;
    piles[chosen] -= takeN;
    sfx("tick");
    render();
    busy = false;
    if (piles.every((p) => p === 0)) {
      finishRound(false);
      return;
    }
    msg.textContent = `Komputer ambil ${takeN}. Giliranmu.`;
  }

  newGame(true);
  return {
    destroy() {
      timers.forEach((t) => clearTimeout(t));
      scr.destroy();
    },
  };
}

/* ---------------------------- PEG SOLITAIRE ------------------------------ */
function pegSolitaire(ctx) {
  const { scr, wrap } = screen(ctx, "🔴 Peg Solitaire", "Lompati pasak, sisakan satu", "min");
  const grid = h("div", { class: "peg-grid" });
  const msg = msgEl(wrap);
  wrap.append(grid);
  const SIZE = 7;
  let board, sel, moves, done;

  const valid = (r, c) => (r >= 2 && r <= 4) || (c >= 2 && c <= 4);

  function newGame() {
    board = Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => (valid(r, c) ? 1 : -1)));
    board[3][3] = 0;
    sel = null;
    moves = 0;
    done = false;
    msg.textContent = "Pilih pasak, lalu lubang tujuan dua langkah.";
    scr.hideOverlay();
    render();
  }

  function render() {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = board[r][c];
        if (v === -1) {
          grid.append(h("div", { class: "peg-cell void" }));
          continue;
        }
        const cls = "peg-cell" + (v === 1 ? " peg" : " hole") + (sel && sel.r === r && sel.c === c ? " sel" : "");
        grid.append(
          h("button", {
            class: cls,
            type: "button",
            text: v === 1 ? "●" : "",
            onclick: () => tap(r, c),
          })
        );
      }
    }
  }

  function legalMove(r1, c1, r2, c2) {
    if (board[r2]?.[c2] !== 0) return false;
    if (Math.abs(r2 - r1) + Math.abs(c2 - c1) !== 2) return false;
    if (r1 !== r2 && c1 !== c2) return false;
    const mr = (r1 + r2) / 2;
    const mc = (c1 + c2) / 2;
    return board[mr]?.[mc] === 1;
  }

  function tap(r, c) {
    if (done) return;
    if (board[r][c] === 1) {
      sel = { r, c };
      sfx("click");
      render();
      return;
    }
    if (!sel) return;
    if (!legalMove(sel.r, sel.c, r, c)) {
      sfx("tick");
      return;
    }
    board[sel.r][sel.c] = 0;
    board[(sel.r + r) / 2][(sel.c + c) / 2] = 0;
    board[r][c] = 1;
    sel = null;
    moves++;
    sfx("drop");
    render();
    const pegs = board.flat().filter((v) => v === 1).length;
    if (pegs === 1) {
      done = true;
      sfx("win");
      scr.end({ score: Math.max(1, moves), title: "Tersisa satu!", sub: `${moves} langkah`, retry: newGame });
      return;
    }
    let any = false;
    for (let r1 = 0; r1 < SIZE; r1++) for (let c1 = 0; c1 < SIZE; c1++) {
      if (board[r1][c1] !== 1) continue;
      for (const [dr, dc] of [[0, 2], [0, -2], [2, 0], [-2, 0]]) {
        if (legalMove(r1, c1, r1 + dr, c1 + dc)) any = true;
      }
    }
    if (!any) {
      done = true;
      sfx("over");
      scr.end({ score: pegs, title: "Buntu", sub: `Sisa ${pegs} pasak`, retry: newGame });
    }
  }

  newGame();
  return { destroy: () => scr.destroy() };
}

/* ------------------------------- GEM MATCH ------------------------------- */
function gemMatch(ctx) {
  const { scr, wrap } = screen(ctx, "💎 Gem Match", "Tukar permata, buat 3 sejajar", "max");
  const grid = h("div", { class: "gem-grid" });
  const movesEl = h("b", { class: "puz-timer", text: "30" });
  const msg = msgEl(wrap);
  wrap.append(h("div", { class: "puz-tools" }, [h("span", { class: "puz-label", text: "Langkah" }), movesEl]), grid);
  const SIZE = 8;
  const COLORS = 5;
  let board, sel, moves, score, done, busy, alive = true, timer = null;

  function randColor() {
    return randInt(0, COLORS - 1);
  }

  function makeBoard() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        let v;
        do {
          v = randColor();
        } while ((c >= 2 && board[r][c - 1] === v && board[r][c - 2] === v) || (r >= 2 && board[r - 1][c] === v && board[r - 2][c] === v));
        board[r][c] = v;
      }
    }
  }

  function newGame() {
    makeBoard();
    sel = null;
    moves = 30;
    score = 0;
    done = false;
    busy = false;
    movesEl.textContent = String(moves);
    msg.textContent = "Ketuk dua permata bersebelahan.";
    scr.setScore(0);
    scr.hideOverlay();
    render();
    if (findMatches().length) resolve();
  }

  function render() {
    grid.innerHTML = "";
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = board[r][c];
        grid.append(
          h("button", {
            class: `gem c${v}` + (sel && sel.r === r && sel.c === c ? " sel" : ""),
            type: "button",
            onclick: () => tap(r, c),
          })
        );
      }
    }
  }

  function findMatches() {
    const out = new Set();
    for (let r = 0; r < SIZE; r++) {
      let run = 1;
      for (let c = 1; c <= SIZE; c++) {
        if (c < SIZE && board[r][c] === board[r][c - 1]) run++;
        else {
          if (run >= 3) for (let k = c - run; k < c; k++) out.add(r + "," + k);
          run = 1;
        }
      }
    }
    for (let c = 0; c < SIZE; c++) {
      let run = 1;
      for (let r = 1; r <= SIZE; r++) {
        if (r < SIZE && board[r][c] === board[r - 1][c]) run++;
        else {
          if (run >= 3) for (let k = r - run; k < r; k++) out.add(k + "," + c);
          run = 1;
        }
      }
    }
    return [...out];
  }

  function resolve() {
    let combo = 0;
    let any = true;
    while (any) {
      const matches = findMatches();
      if (!matches.length) break;
      combo++;
      score += matches.length * 10 * combo;
      scr.setScore(score);
      matches.forEach((k) => {
        const [r, c] = k.split(",").map(Number);
        board[r][c] = -1;
      });
      // gravitasi + isi
      for (let c = 0; c < SIZE; c++) {
        const col = [];
        for (let r = SIZE - 1; r >= 0; r--) if (board[r][c] >= 0) col.push(board[r][c]);
        while (col.length < SIZE) col.push(randColor());
        for (let r = SIZE - 1, i = 0; r >= 0; r--, i++) board[r][c] = col[i];
      }
      render();
      any = true;
    }
    if (combo) sfx("point");
  }

  function tap(r, c) {
    if (done || busy) return;
    if (!sel) {
      sel = { r, c };
      sfx("click");
      render();
      return;
    }
    const s = sel;
    if (s.r === r && s.c === c) {
      sel = null;
      render();
      return;
    }
    if (Math.abs(s.r - r) + Math.abs(s.c - c) !== 1) {
      sel = { r, c };
      sfx("click");
      render();
      return;
    }
    // tukar
    [board[s.r][s.c], board[r][c]] = [board[r][c], board[s.r][s.c]];
    sel = null;
    const matches = findMatches();
    if (!matches.length) {
      [board[s.r][s.c], board[r][c]] = [board[r][c], board[s.r][s.c]];
      sfx("hit");
      render();
      msg.textContent = "Tidak ada yang cocok.";
      return;
    }
    moves--;
    movesEl.textContent = String(moves);
    busy = true;
    render();
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!alive) return;
      resolve();
      busy = false;
      if (moves <= 0) {
        done = true;
        sfx("over");
        scr.end({ score, title: "Langkah habis", sub: `Skor ${score}`, retry: newGame });
      }
    }, 60);
  }

  newGame();
  return {
    destroy: () => {
      alive = false;
      clearTimeout(timer);
      scr.destroy();
    },
  };
}

/* ------------------------------- RUSH HOUR ------------------------------- */
const RUSH_LEVELS = [
  [
    { id: "R", len: 2, dir: "h", r: 2, c: 0, player: true },
    { id: "V", len: 2, dir: "v", r: 1, c: 3 },
  ],
  [
    { id: "R", len: 2, dir: "h", r: 2, c: 0, player: true },
    { id: "V", len: 2, dir: "v", r: 1, c: 3 },
    { id: "H", len: 2, dir: "h", r: 2, c: 4 },
    { id: "X", len: 2, dir: "h", r: 0, c: 0 },
  ],
];
const CAR_COLORS = ["#ef4444", "#38bdf8", "#a3e635", "#fbbf24", "#a78bfa", "#f472b6", "#2dd4bf", "#fb923c"];

function rushHour(ctx) {
  const { scr, wrap } = screen(ctx, "🚗 Rush Hour", "Keluarkan mobil merah dari kemacetan", "min");
  const grid = h("div", { class: "rush-grid" });
  const pad = h("div", { class: "puz-pad" });
  const msg = msgEl(wrap);
  wrap.append(grid, pad);
  const SIZE = 6;
  let cars, sel, moves, level, done;

  for (const [label, key] of [["▲", "up"], ["◀", "left"], ["▼", "down"], ["▶", "right"]]) {
    pad.append(h("button", { class: "np-btn", type: "button", text: label, onclick: () => moveSel(key) }));
  }

  function load(lv) {
    level = lv;
    cars = RUSH_LEVELS[lv].map((c, i) => ({ ...c, color: c.player ? "#ef4444" : CAR_COLORS[(i + 1) % CAR_COLORS.length] }));
    sel = null;
    moves = 0;
    done = false;
    msg.textContent = `Level ${lv + 1} · mobil merah harus keluar kanan.`;
    scr.hideOverlay();
    render();
  }

  function occupied(r, c, except) {
    return cars.find((car) => {
      if (car === except) return false;
      for (let k = 0; k < car.len; k++) {
        if ((car.dir === "h" ? car.r === r && car.c + k === c : car.c === c && car.r + k === r)) return true;
      }
      return false;
    });
  }

  function render() {
    grid.innerHTML = "";
    const cells = [];
    for (let r = 0; r < SIZE; r++) {
      cells.push([]);
      for (let c = 0; c < SIZE; c++) cells[r].push(null);
    }
    cars.forEach((car, i) => {
      for (let k = 0; k < car.len; k++) {
        const r = car.dir === "h" ? car.r : car.r + k;
        const c = car.dir === "h" ? car.c + k : car.c;
        if (cells[r]) cells[r][c] = { car, i, k };
      }
    });
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const info = cells[r][c];
        if (info) {
          const car = info.car;
          const style = { background: car.color };
          if (info.k === 0) style.borderTopLeftRadius = "7px";
          if (info.k === car.len - 1) style.borderBottomRightRadius = "7px";
          grid.append(
            h("button", {
              class: "rush-cell car" + (sel === info.i ? " sel" : "") + (car.player ? " player" : "") + (car.player && info.k === car.len - 1 ? " nose" : ""),
              type: "button",
              style,
              text: info.k === 0 ? (car.player ? "🚗" : "") : "",
              onclick: () => {
                sel = info.i;
                sfx("click");
                render();
              },
            })
          );
        } else {
          grid.append(
            h("button", {
              class: "rush-cell" + (r === 2 && c === SIZE - 1 ? " exit" : ""),
              type: "button",
              text: r === 2 && c === SIZE - 1 ? "→" : "",
              onclick: () => {
                sel = null;
                render();
              },
            })
          );
        }
      }
    }
  }

  function moveSel(dir) {
    if (done || sel === null) return;
    const car = cars[sel];
    let dr = 0;
    let dc = 0;
    if (car.dir === "h") {
      if (dir !== "left" && dir !== "right") return;
      dc = dir === "right" ? 1 : -1;
    } else {
      if (dir !== "up" && dir !== "down") return;
      dr = dir === "up" ? -1 : 1;
    }
    const nr = car.r + dr;
    const nc = car.c + dc;
    // cek batas
    if (car.dir === "h") {
      if (nc < 0 || nc + car.len > SIZE) {
        if (car.player && nc + car.len > SIZE) {
          // merah keluar
          done = true;
          moves++;
          sfx("win");
          scr.end({ score: Math.max(1, moves), title: "Bebas!", sub: `${moves} langkah`, retry: () => load(0) });
          return;
        }
        return;
      }
    } else if (nr < 0 || nr + car.len > SIZE) return;
    // cek tabrakan
    for (let k = 0; k < car.len; k++) {
      const rr = car.dir === "h" ? nr : nr + k;
      const cc = car.dir === "h" ? nc + k : nc;
      if (occupied(rr, cc, car)) {
        sfx("tick");
        return;
      }
    }
    car.r = nr;
    car.c = nc;
    moves++;
    sfx("click");
    render();
    if (car.player && car.c + car.len > SIZE) {
      done = true;
      sfx("win");
      scr.end({ score: Math.max(1, moves), title: "Bebas!", sub: `${moves} langkah`, retry: () => load(0) });
      return;
    }
    // level berikut kalau ada
    if (car.player && car.c + car.len === SIZE + 1) {
      done = true;
      scr.end({ score: Math.max(1, moves), title: "Bebas!", sub: `${moves} langkah`, retry: () => load(0) });
    }
  }

  load(0);
  return { destroy: () => scr.destroy() };
}

export const puzzles2 = [
  { id: "number-merge", name: "Number Merge", emoji: "🔢", tag: "Puzzle", desc: "Gabungkan angka di grid 4×4.", bestMode: "max", mount: (ctx) => game2048(ctx, 4, "Number Merge", "🔢") },
  { id: "2048-5x5", name: "2048 5×5", emoji: "🧮", tag: "Puzzle", desc: "2048 dengan grid lebih luas 5×5.", bestMode: "max", mount: (ctx) => game2048(ctx, 5, "2048 5×5", "🧮") },
  { id: "pipe-connect", name: "Pipe Connect", emoji: "🔧", tag: "Puzzle", desc: "Putar pipa agar air sampai keluar.", bestMode: "min", mount: pipeConnect },
  { id: "color-sort", name: "Color Sort", emoji: "🌈", tag: "Puzzle", desc: "Sortir warna ke tabung masing-masing.", bestMode: "min", mount: colorSort },
  { id: "maze-escape", name: "Maze Escape", emoji: "🌀", tag: "Puzzle", desc: "Cari jalan keluar labirin 15×15.", bestMode: "min", mount: mazeEscape },
  { id: "tower-hanoi", name: "Tower Hanoi", emoji: "🗼", tag: "Puzzle", desc: "Pindahkan 4 cakram ke tiang kanan.", bestMode: "min", mount: hanoi },
  { id: "nim", name: "Nim", emoji: "🎯", tag: "Puzzle", desc: "Ambil bola terakhir, kalahkan komputer.", bestMode: "max", mount: nim },
  { id: "peg-solitaire", name: "Peg Solitaire", emoji: "🔴", tag: "Puzzle", desc: "Lompati pasak sampai tersisa satu.", bestMode: "min", mount: pegSolitaire },
  { id: "gem-match", name: "Gem Match", emoji: "💎", tag: "Puzzle", desc: "Tukar permata, dapatkan combo.", bestMode: "max", mount: gemMatch },
  { id: "rush-hour", name: "Rush Hour", emoji: "🚗", tag: "Puzzle", desc: "Keluarkan mobil merah dari macet.", bestMode: "min", mount: rushHour },
];
