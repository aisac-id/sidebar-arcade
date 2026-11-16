// Pack papan & kartu: catur, reversi, gomoku, kapal, blackjack, poker, dll.
import { h, clamp, randInt, pick, shuffle, sfx, sleep } from "../lib/kit.js";
import { shell, betRow } from "../lib/engines/casino.js";
import { mkScreen, note, newDeck, cardEl, dieEl, setGrid, guard } from "./_shared.js";

/* ------------------------------- CHECKERS -------------------------------- */
function checkers(ctx) {
  const { scr, wrap } = mkScreen(ctx, "⚫ Checkers", "Kamu merah · klik bidak lalu kotak tujuan");
  const stEl = note(wrap, "Giliran kamu");
  const board = h("div", { class: "board8" });
  setGrid(board, 8, "2px");
  wrap.append(board);
  let st, sel = -1, locked = false, captured = 0;
  const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  const movesFor = (side) => {
    const res = [];
    for (let i = 0; i < 64; i++) {
      const p = st[i];
      if (!p || p.c !== side) continue;
      const r = Math.floor(i / 8), c = i % 8;
      const dirs = p.k ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : side === "r" ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (!inb(nr, nc)) continue;
        const ni = nr * 8 + nc;
        if (!st[ni]) res.push({ from: i, to: ni, cap: -1 });
        else if (st[ni].c !== side) {
          const jr = r + dr * 2, jc = c + dc * 2;
          if (!inb(jr, jc)) continue;
          const ji = jr * 8 + jc;
          if (!st[ji]) res.push({ from: i, to: ji, cap: ni });
        }
      }
    }
    const caps = res.filter((m) => m.cap >= 0);
    return caps.length ? caps : res;
  };

  const apply = (m) => {
    const p = st[m.from];
    st[m.from] = null;
    if (m.cap >= 0) {
      st[m.cap] = null;
      if (p.c === "r") captured++;
    }
    const row = Math.floor(m.to / 8);
    p.k = p.k || row === 0 || row === 7;
    st[m.to] = p;
  };

  const render = () => {
    board.innerHTML = "";
    const targets = sel >= 0 ? movesFor("r").filter((m) => m.from === sel).map((m) => m.to) : [];
    for (let i = 0; i < 64; i++) {
      const r = Math.floor(i / 8), c = i % 8;
      const p = st[i];
      const el = h("button", { class: "sq8" + ((r + c) % 2 ? " dark" : " light") + (i === sel ? " sel" : "") + (targets.includes(i) ? " can" : ""), type: "button" }, [
        p ? h("span", { class: "piece " + (p.c === "r" ? "red" : "blk") + (p.k ? " king" : ""), text: p.k ? "♛" : "" }) : "",
      ]);
      el.onclick = () => click(i);
      board.append(el);
    }
  };

  const finish = (win) => {
    locked = true;
    const score = captured * 10 + (win ? 100 : 0);
    scr.end({ score, title: win ? "Menang! 🎉" : "Kalah", sub: `${captured} bidak lawan tertangkap`, retry: init });
  };

  const click = (i) => {
    if (locked) return;
    if (sel >= 0) {
      const m = movesFor("r").find((x) => x.from === sel && x.to === i);
      if (m) {
        apply(m);
        sel = -1;
        sfx("flip");
        render();
        scr.setScore(captured * 10);
        if (!movesFor("b").length) return finish(true);
        locked = true;
        stEl.textContent = "AI mikir…";
        setTimeout(() => {
          const ms = movesFor("b");
          if (!ms.length) return finish(true);
          const caps = ms.filter((m) => m.cap >= 0);
          apply(pick(caps.length ? caps : ms));
          sfx("tick");
          render();
          if (!movesFor("r").length) return finish(false);
          locked = false;
          stEl.textContent = "Giliran kamu";
        }, 320);
        return;
      }
    }
    if (st[i] && st[i].c === "r") {
      sel = i;
      sfx("click");
      render();
    }
  };

  function init() {
    st = Array(64).fill(null);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) st[r * 8 + c] = { c: "b", k: false };
    for (let r = 5; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2) st[r * 8 + c] = { c: "r", k: false };
    sel = -1;
    locked = false;
    captured = 0;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Giliran kamu";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* -------------------------------- REVERSI -------------------------------- */
const DIRS8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

function reversi(ctx) {
  const { scr, wrap } = mkScreen(ctx, "⚪ Reversi", "Kamu hitam · kepung lawan");
  const stEl = note(wrap, "Giliran kamu");
  const board = h("div", { class: "board8" });
  setGrid(board, 8, "2px");
  wrap.append(board);
  let st, locked = false;
  const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  const flips = (i, who) => {
    if (st[i]) return [];
    const out = [];
    const r = Math.floor(i / 8), c = i % 8;
    for (const [dr, dc] of DIRS8) {
      const line = [];
      let nr = r + dr, nc = c + dc;
      while (inb(nr, nc) && st[nr * 8 + nc] && st[nr * 8 + nc] !== who) {
        line.push(nr * 8 + nc);
        nr += dr;
        nc += dc;
      }
      if (line.length && inb(nr, nc) && st[nr * 8 + nc] === who) out.push(...line);
    }
    return out;
  };

  const legal = (who) => {
    const res = [];
    for (let i = 0; i < 64; i++) if (flips(i, who).length) res.push(i);
    return res;
  };

  const put = (i, who) => {
    st[i] = who;
    flips(i, who).forEach((j) => (st[j] = who));
  };

  const counts = () => st.reduce((a, v) => ((a[v] = (a[v] || 0) + 1), a), {});
  const showScore = () => {
    const c = counts();
    scr.setScore(c[1] || 0);
    return c;
  };

  const finish = () => {
    const c = showScore();
    const win = (c[1] || 0) > (c[2] || 0);
    scr.end({
      score: c[1] || 0,
      title: win ? "Menang! 🎉" : (c[1] || 0) === (c[2] || 0) ? "Seri" : "Kalah",
      sub: `Hitam ${c[1] || 0} · Putih ${c[2] || 0}`,
      retry: init,
    });
  };

  const aiTurn = () => {
    const ms = legal(2);
    if (!ms.length) {
      if (!legal(1).length) return finish();
      locked = false;
      stEl.textContent = "Kamu main lagi";
      render();
      return;
    }
    let best = ms[0], bestN = -1;
    for (const m of ms) {
      const n = flips(m, 2).length + Math.random();
      if (n > bestN) {
        bestN = n;
        best = m;
      }
    }
    put(best, 2);
    sfx("tick");
    render();
    showScore();
    if (!legal(1).length) {
      if (!legal(2).length) return finish();
      setTimeout(aiTurn, 350);
      return;
    }
    locked = false;
    stEl.textContent = "Giliran kamu";
  };

  const render = () => {
    board.innerHTML = "";
    const ok = new Set(legal(1));
    for (let i = 0; i < 64; i++) {
      const el = h("button", { class: "sq8 " + (i % 2 === 0 ? "light" : "dark") + (ok.has(i) ? " can" : ""), type: "button" });
      if (st[i]) el.append(h("span", { class: "disc " + (st[i] === 1 ? "black" : "white") }));
      el.onclick = () => {
        if (locked || !ok.has(i)) return;
        put(i, 1);
        sfx("flip");
        render();
        showScore();
        if (!legal(2).length && !legal(1).length) return finish();
        locked = true;
        stEl.textContent = "AI mikir…";
        setTimeout(aiTurn, 320);
      };
      board.append(el);
    }
  };

  function init() {
    st = Array(64).fill(0);
    st[27] = 2;
    st[28] = 1;
    st[35] = 1;
    st[36] = 2;
    locked = false;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Giliran kamu";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* --------------------------------- GOMOKU -------------------------------- */
const GDIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

function gomoku(ctx) {
  const N = 11;
  const { scr, wrap } = mkScreen(ctx, "⚫ Gomoku", "Lima sejajar menang · kamu hitam");
  const stEl = note(wrap, "Giliran kamu");
  const board = h("div", { class: "board-gomoku" });
  setGrid(board, N, "1px");
  wrap.append(board);
  let st, locked = false;

  const inb = (r, c) => r >= 0 && r < N && c >= 0 && c < N;

  const won = (who) => {
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (st[r * N + c] !== who) continue;
        for (const [dr, dc] of GDIRS) {
          let n = 1;
          for (let k = 1; k < 5; k++) {
            const nr = r + dr * k, nc = c + dc * k;
            if (!inb(nr, nc) || st[nr * N + nc] !== who) break;
            n++;
          }
          if (n >= 5) return true;
        }
      }
    return false;
  };

  const render = () => {
    board.innerHTML = "";
    for (let i = 0; i < N * N; i++) {
      const v = st[i];
      const el = h("button", { class: "gom-cell" + (v === 1 ? " x" : v === 2 ? " o" : ""), type: "button", text: v === 1 ? "●" : v === 2 ? "○" : "" });
      el.onclick = () => {
        if (locked || st[i]) return;
        st[i] = 1;
        sfx("flip");
        render();
        if (won(1)) return end(true);
        locked = true;
        stEl.textContent = "AI mikir…";
        setTimeout(aiMove, 260);
      };
      board.append(el);
    }
  };

  const scoreCell = (i, who) => {
    const r = Math.floor(i / N), c = i % N;
    let total = 0;
    for (const [dr, dc] of GDIRS) {
      let run = 1, open = 0;
      for (const sgn of [1, -1]) {
        let k = 1;
        for (;;) {
          const nr = r + dr * k * sgn, nc = c + dc * k * sgn;
          if (!inb(nr, nc)) break;
          const v = st[nr * N + nc];
          if (v === who) run++;
          else {
            if (v === 0) open++;
            break;
          }
          k++;
        }
      }
      if (run >= 5) total += 100000;
      else total += Math.pow(run, 3) + open * run * 2;
    }
    return total;
  };

  const aiMove = () => {
    let best = -1, bestS = -1;
    for (let i = 0; i < N * N; i++) {
      if (st[i]) continue;
      const s = scoreCell(i, 2) * 1.15 + scoreCell(i, 1) + Math.random();
      if (s > bestS) {
        bestS = s;
        best = i;
      }
    }
    if (best < 0) return end(false);
    st[best] = 2;
    sfx("tick");
    render();
    if (won(2)) return end(false);
    locked = false;
    stEl.textContent = "Giliran kamu";
  };

  const end = (win) => {
    locked = true;
    scr.end({
      score: win ? 100 : 0,
      title: win ? "Menang! 🎉" : "AI menang",
      sub: win ? "Lima sejajar!" : "Coba potong jalurnya",
      retry: init,
    });
  };

  function init() {
    st = Array(N * N).fill(0);
    locked = false;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Giliran kamu";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* ------------------------------ DOTS & BOXES ----------------------------- */
function dotsBoxes(ctx) {
  const N = 6, B = 5;
  const { scr, wrap } = mkScreen(ctx, "🔵 Dots & Boxes", "Tutup kotak terbanyak");
  const stEl = note(wrap, "Kotak: kamu 0 · AI 0");
  const board = h("div", { class: "dots-board" });
  setGrid(board, 2 * N - 1, "2px");
  wrap.append(board);
  let he, ve, own, pBox, cBox, left;

  const render = () => {
    board.innerHTML = "";
    for (let rr = 0; rr < 2 * N - 1; rr++)
      for (let cc = 0; cc < 2 * N - 1; cc++) {
        const er = rr % 2 === 0, ec = cc % 2 === 0;
        if (er && ec) {
          board.append(h("div", { class: "dot" }));
        } else if (er) {
          const r = rr / 2, c = (cc - 1) / 2;
          const on = he[r][c];
          const el = h("button", { class: "edge-h" + (on ? " on" : ""), type: "button" });
          el.onclick = () => line("h", r, c);
          board.append(el);
        } else if (ec) {
          const r = (rr - 1) / 2, c = cc / 2;
          const on = ve[r][c];
          const el = h("button", { class: "edge-v" + (on ? " on" : ""), type: "button" });
          el.onclick = () => line("v", r, c);
          board.append(el);
        } else {
          const r = (rr - 1) / 2, c = (cc - 1) / 2;
          const o = own[r][c];
          board.append(h("div", { class: "box" + (o === 1 ? " p" : o === 2 ? " c" : "") }, [o === 1 ? "🟦" : o === 2 ? "🟥" : ""]));
        }
      }
  };

  const completeBoxes = (who) => {
    let got = 0;
    for (let r = 0; r < B; r++)
      for (let c = 0; c < B; c++) {
        if (own[r][c]) continue;
        if (he[r][c] && he[r + 1][c] && ve[r][c] && ve[r][c + 1]) {
          own[r][c] = who;
          got++;
        }
      }
    if (got) {
      if (who === 1) pBox += got;
      else cBox += got;
      sfx("point");
      stEl.textContent = `Kotak: kamu ${pBox} · AI ${cBox}`;
    }
    return got;
  };

  const finish = () => {
    scr.end({
      score: pBox,
      title: pBox > cBox ? "Kamu menang! 🎉" : pBox === cBox ? "Seri" : "Kalah",
      sub: `Kamu ${pBox} · AI ${cBox}`,
      retry: init,
    });
  };

  const cpuTurn = () => {
    const opts = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < B; c++) if (!he[r][c]) opts.push(["h", r, c]);
    for (let r = 0; r < B; r++) for (let c = 0; c < N; c++) if (!ve[r][c]) opts.push(["v", r, c]);
    if (!opts.length) return finish();
    const [t, r, c] = pick(opts);
    if (t === "h") he[r][c] = true;
    else ve[r][c] = true;
    left--;
    sfx("tick");
    completeBoxes(2);
    render();
    if (left <= 0) return finish();
    stEl.textContent = "Giliran kamu";
  };

  const line = (t, r, c) => {
    if (t === "h") {
      if (he[r][c]) return;
      he[r][c] = true;
    } else {
      if (ve[r][c]) return;
      ve[r][c] = true;
    }
    left--;
    sfx("click");
    const got = completeBoxes(1);
    render();
    if (left <= 0) return finish();
    if (got) {
      stEl.textContent = `Bagus! Kotak: kamu ${pBox} · AI ${cBox}`;
      return;
    }
    stEl.textContent = "AI jalan…";
    setTimeout(cpuTurn, 300);
  };

  function init() {
    he = Array.from({ length: N }, () => Array(B).fill(false));
    ve = Array.from({ length: B }, () => Array(N).fill(false));
    own = Array.from({ length: B }, () => Array(B).fill(0));
    pBox = 0;
    cBox = 0;
    left = 2 * N * B;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Kotak: kamu 0 · AI 0";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* ------------------------------- BATTLESHIP ------------------------------ */
function placeFleet() {
  const grid = Array(100).fill(0);
  for (const len of [5, 4, 3, 3, 2]) {
    for (let tries = 0; tries < 300; tries++) {
      const horiz = Math.random() < 0.5;
      const r = randInt(0, horiz ? 9 : 10 - len);
      const c = randInt(0, horiz ? 10 - len : 9);
      const cells = [];
      for (let i = 0; i < len; i++) cells.push(horiz ? r * 10 + c + i : (r + i) * 10 + c);
      if (cells.every((x) => !grid[x])) {
        cells.forEach((x) => (grid[x] = len));
        break;
      }
    }
  }
  return grid;
}

function battleship(ctx) {
  const { scr, wrap } = mkScreen(ctx, "🚢 Battleship", "Tembak 17 petak kapal musuh");
  const stEl = note(wrap, "Klik petak untuk menembak");
  const board = h("div", { class: "bs-board" });
  setGrid(board, 10, "2px");
  wrap.append(board);
  let enemy, mine, shots, aiShots, hits, alive, locked;

  const render = () => {
    board.innerHTML = "";
    for (let i = 0; i < 100; i++) {
      const s = shots[i];
      const el = h("button", { class: "bs-cell" + (s === "x" ? " hit" : s === "o" ? " miss" : ""), type: "button", text: s === "x" ? "✸" : s === "o" ? "·" : "" });
      el.onclick = () => fire(i);
      board.append(el);
    }
  };

  const fire = (i) => {
    if (locked || shots[i]) return;
    shots[i] = enemy[i] ? "x" : "o";
    if (enemy[i]) {
      hits++;
      alive--;
      sfx("hit");
      scr.setScore(hits * 10);
    } else sfx("miss");
    render();
    if (alive <= 0) return end(true);
    locked = true;
    stEl.textContent = "Musuh membalas…";
    setTimeout(() => {
      let idx;
      do idx = randInt(0, 99);
      while (aiShots[idx]);
      aiShots[idx] = true;
      if (mine[idx]) {
        mineHits++;
        sfx("over");
      }
      if (mineHits >= 17) return end(false);
      locked = false;
      stEl.textContent = `Kena ${hits}/17 · kapalmu ${17 - mineHits}/17`;
    }, 350);
  };

  let mineHits = 0;

  const end = (win) => {
    scr.end({
      score: hits * 10 + (win ? 50 : 0),
      title: win ? "Armada musuh tenggelam! 🎉" : "Kapalmu tenggelam",
      sub: `${hits} tembakan tepat`,
      retry: init,
    });
  };

  function init() {
    enemy = placeFleet();
    mine = placeFleet();
    shots = Array(100).fill(null);
    aiShots = Array(100).fill(false);
    hits = 0;
    mineHits = 0;
    alive = 17;
    locked = false;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Klik petak untuk menembak";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* -------------------------------- BLACKJACK ------------------------------ */
const handValue = (hand) => {
  let s = 0, a = 0;
  for (const c of hand) {
    if (c.r === 14) {
      s += 11;
      a++;
    } else s += Math.min(10, c.r);
  }
  while (s > 21 && a) {
    s -= 10;
    a--;
  }
  return s;
};

function blackjack(ctx) {
  const g = shell(ctx, { title: "🂡 Blackjack", subtitle: "21 mendekati, jangan lewat", credits: 200, hint: "Tekan DEAL untuk mulai" });
  const bet = { value: 10 };
  const bu = betRow(bet);
  const dealerEl = h("div", { class: "hand" });
  const playerEl = h("div", { class: "hand" });
  const row = h("div", { class: "btn-row wrap" });
  const dealBtn = h("button", { class: "btn primary", type: "button", text: "DEAL" });
  const hitBtn = h("button", { class: "btn", type: "button", text: "HIT" });
  const standBtn = h("button", { class: "btn", type: "button", text: "STAND" });
  const reset = h("button", { class: "btn ghost tiny", type: "button", text: "Reset kredit" });
  row.append(dealBtn, hitBtn, standBtn);
  g.wrap.append(h("p", { class: "hand-label", text: "DEALER" }), dealerEl, h("p", { class: "hand-label", text: "KAMU" }), playerEl, bu.row, row, reset);
  let deck, p = [], d = [], phase = "idle", stake = 0;

  const ghost = () => h("span", { class: "pcard back ghost", text: "✦" });
  const render = (hide) => {
    dealerEl.innerHTML = "";
    playerEl.innerHTML = "";
    if (!d.length) dealerEl.append(ghost(), ghost());
    if (!p.length) playerEl.append(ghost(), ghost());
    d.forEach((c, i) => dealerEl.append(cardEl(c, hide && i === 1)));
    p.forEach((c) => playerEl.append(cardEl(c)));
  };
  render(false);
  const btnState = () => {
    dealBtn.disabled = phase === "play";
    hitBtn.disabled = phase !== "play";
    standBtn.disabled = phase !== "play";
  };
  const settle = (mult, msg) => {
    phase = "idle";
    if (mult > 0) {
      g.add(Math.round(stake * mult));
      sfx("win");
      g.say(msg, "win");
    } else if (mult === 0) {
      g.add(stake);
      g.say(msg, "");
    } else {
      sfx("lose");
      g.say(msg, "lose");
    }
    btnState();
  };
  const dealerPlay = () => {
    while (handValue(d) < 17) d.push(deck.pop());
    render(false);
    const pv = handValue(p), dv = handValue(d);
    if (dv > 21) settle(2, `Dealer lewat (${dv}). Kamu menang!`);
    else if (pv > dv) settle(2, `Kamu ${pv} vs ${dv}. Menang!`);
    else if (pv === dv) settle(0, `Seri ${pv}. Taruhan kembali.`);
    else settle(-1, `Kamu ${pv} vs ${dv}. Kalah.`);
  };
  dealBtn.onclick = () => {
    if (phase === "play") return;
    if (!g.take(bet.value)) return;
    stake = bet.value;
    deck = newDeck();
    p = [deck.pop(), deck.pop()];
    d = [deck.pop(), deck.pop()];
    phase = "play";
    render(true);
    btnState();
    sfx("deal");
    g.say(`Taruhan ${stake}. ${handValue(p) === 21 ? "Blackjack!" : "Hit atau stand?"}`);
    if (handValue(p) === 21) {
      phase = "dealer";
      setTimeout(() => {
        if (handValue(d) === 21) settle(0, "Dua-duanya blackjack. Seri.");
        else settle(2.5, "Blackjack! Bayaran 3:2 🎉");
      }, 400);
    }
  };
  hitBtn.onclick = () => {
    if (phase !== "play") return;
    p.push(deck.pop());
    render(true);
    sfx("flip");
    const v = handValue(p);
    g.say(`Total ${v}`);
    if (v > 21) {
      render(false);
      settle(-1, `Bust ${v}. Kalah.`);
    } else if (v === 21) dealerPlay();
  };
  standBtn.onclick = () => {
    if (phase !== "play") return;
    phase = "dealer";
    dealerPlay();
  };
  reset.onclick = () => {
    g.setCredits(200);
    g.say("Kredit direset. Tekan DEAL.");
  };
  btnState();
  render(true);
  return { destroy: g.scr.destroy };
}

/* ------------------------------- VIDEO POKER ----------------------------- */
const POKER_PAY = [
  { name: "Royal Flush", mult: 250, test: (h) => h.straight && h.flush && h.high === 14 },
  { name: "Straight Flush", mult: 50, test: (h) => h.straight && h.flush },
  { name: "Four of a Kind", mult: 25, test: (h) => h.quads },
  { name: "Full House", mult: 9, test: (h) => h.full },
  { name: "Flush", mult: 6, test: (h) => h.flush },
  { name: "Straight", mult: 4, test: (h) => h.straight },
  { name: "Three of a Kind", mult: 3, test: (h) => h.trips },
  { name: "Two Pair", mult: 2, test: (h) => h.pairs >= 2 },
  { name: "Jacks or Better", mult: 1, test: (h) => h.pairs >= 1 && h.highPair >= 11 },
];

function pokerHand(cards) {
  const rs = cards.map((c) => c.r).sort((a, b) => a - b);
  const counts = {};
  rs.forEach((r) => (counts[r] = (counts[r] || 0) + 1));
  const vals = Object.values(counts).sort((a, b) => b - a);
  const flush = cards.every((c) => c.s === cards[0].s);
  let straight = true;
  for (let i = 1; i < 5; i++) if (rs[i] !== rs[i - 1] + 1) straight = false;
  if (!straight && rs.join(",") === "2,3,4,5,14") straight = true;
  let pairs = 0, highPair = 0;
  for (const [r, n] of Object.entries(counts)) {
    if (n === 2) {
      pairs++;
      highPair = Math.max(highPair, Number(r));
    }
  }
  return {
    flush,
    straight,
    quads: vals[0] === 4,
    trips: vals[0] === 3,
    full: vals[0] === 3 && vals[1] === 2,
    pairs,
    highPair,
    high: Math.max(...rs),
  };
}

function videoPoker(ctx) {
  const g = shell(ctx, { title: "🃏 Video Poker", subtitle: "Jacks or Better · tahan kartu bagus", credits: 200, hint: "Tekan DEAL, pilih kartu untuk ditahan" });
  const bet = { value: 10 };
  const bu = betRow(bet);
  const handEl = h("div", { class: "hand" });
  const resultEl = h("p", { class: "casino-msg", text: "Pilih taruhan lalu DEAL." });
  const action = h("button", { class: "btn primary", type: "button", text: "DEAL" });
  const reset = h("button", { class: "btn ghost tiny", type: "button", text: "Reset kredit" });
  g.wrap.append(handEl, bu.row, action, resultEl, reset);
  let deck, hand = [], held = [false, false, false, false, false], phase = "idle", stake = 0;

  const render = () => {
    handEl.innerHTML = "";
    hand.forEach((c, i) => {
      const el = h("div", { class: "pcard-slot" + (held[i] ? " held" : "") }, [cardEl(c), h("small", { text: held[i] ? "TAHAN" : "" })]);
      el.onclick = () => {
        if (phase !== "draw") return;
        held[i] = !held[i];
        sfx("click");
        render();
      };
      handEl.append(el);
    });
  };

  const finish = () => {
    const hh = pokerHand(hand);
    const pay = POKER_PAY.find((p) => p.test(hh));
    phase = "idle";
    action.textContent = "DEAL";
    if (pay) {
      g.add(stake * pay.mult);
      sfx("win");
      resultEl.textContent = `${pay.name}! +${stake * pay.mult} kredit`;
      resultEl.className = "casino-msg win";
    } else {
      sfx("lose");
      resultEl.textContent = "Tidak ada kombinasi. Coba lagi.";
      resultEl.className = "casino-msg lose";
    }
  };

  action.onclick = () => {
    if (phase === "idle") {
      if (!g.take(bet.value)) return;
      stake = bet.value;
      deck = newDeck();
      hand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
      held = [false, false, false, false, false];
      phase = "draw";
      action.textContent = "DRAW";
      resultEl.textContent = "Klik kartu untuk menahan, lalu DRAW.";
      resultEl.className = "casino-msg";
      render();
      sfx("deal");
    } else {
      hand = hand.map((c, i) => (held[i] ? c : deck.pop()));
      render();
      sfx("flip");
      setTimeout(finish, 250);
    }
  };
  reset.onclick = () => g.setCredits(200);
  render();
  return { destroy: g.scr.destroy };
}

/* ---------------------------------- WAR ---------------------------------- */
function war(ctx) {
  const { scr, wrap } = mkScreen(ctx, "⚔️ War", "Kartu tertinggi menang");
  const slots = h("div", { class: "war-row" });
  const aEl = h("div", { class: "war-slot" }), bEl = h("div", { class: "war-slot" });
  slots.append(h("div", { class: "war-side" }, [h("small", { text: "KAMU" }), aEl]), h("div", { class: "war-vs", text: "VS" }), h("div", { class: "war-side" }, [h("small", { text: "AI" }), bEl]));
  const stEl = note(wrap, "52 kartu dibagi rata");
  const btn = h("button", { class: "btn primary", type: "button", text: "FLIP" });
  wrap.append(slots, btn);
  let p, c, rounds = 0, locked = false;

  const render = () => {
    aEl.innerHTML = "";
    bEl.innerHTML = "";
  };
  const end = () => {
    const win = p.length > c.length;
    scr.end({
      score: p.length,
      title: win ? "Kamu menang! 🎉" : "Kalah",
      sub: `Sisa kartu kamu ${p.length} · AI ${c.length}`,
      retry: init,
    });
  };

  btn.onclick = () => {
    if (locked || !p.length || !c.length) return;
    locked = true;
    const pa = p.shift(), ca = c.shift();
    aEl.innerHTML = "";
    bEl.innerHTML = "";
    aEl.append(cardEl(pa));
    bEl.append(cardEl(ca));
    rounds++;
    if (pa.r > ca.r) {
      p.push(pa, ca);
      sfx("point");
      stEl.textContent = `Kamu ambil kartu (${rounds})`;
    } else if (pa.r < ca.r) {
      c.push(pa, ca);
      sfx("over");
      stEl.textContent = `AI ambil kartu (${rounds})`;
    } else {
      sfx("tick");
      stEl.textContent = "Seri — kedua kartu hangus";
    }
    setTimeout(() => {
      locked = false;
      if (!p.length || !c.length) end();
    }, 250);
  };

  function init() {
    const deck = newDeck();
    p = deck.slice(0, 26);
    c = deck.slice(26);
    rounds = 0;
    locked = false;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "52 kartu dibagi rata";
    render();
    guard(scr);
  }
  init();
  return { destroy: scr.destroy };
}

/* -------------------------------- HIGH LOW ------------------------------- */
function highLow(ctx) {
  const { scr, wrap } = mkScreen(ctx, "📈 High Low", "Tebak kartu berikutnya lebih tinggi/rendah");
  const cardWrap = h("div", { class: "hl-card" });
  const stEl = note(wrap, "Tebak kartu berikutnya");
  const row = h("div", { class: "btn-row" });
  const hi = h("button", { class: "btn primary", type: "button", text: "LEBIH TINGGI" });
  const lo = h("button", { class: "btn", type: "button", text: "LEBIH RENDAH" });
  row.append(hi, lo);
  wrap.append(cardWrap, row);
  let deck, cur, streak = 0, alive = true, ended = false;

  const draw = () => {
    if (deck.length < 5) deck = newDeck();
    cardWrap.innerHTML = "";
    cardWrap.append(cardEl(cur));
  };
  const finish = () => {
    ended = true;
    scr.end({ score: streak, title: "Salah tebak", sub: `Streak ${streak} kartu`, retry: init });
  };
  const guess = (high) => {
    if (ended) return;
    const next = deck.pop();
    const ok = next.r === cur.r || (high ? next.r > cur.r : next.r < cur.r);
    if (!ok) {
      cur = next;
      draw();
      sfx("over");
      return finish();
    }
    streak++;
    scr.setScore(streak);
    sfx("point");
    if (next.r === cur.r) stEl.textContent = `Seri (${streak}), lanjut`;
    else stEl.textContent = `Benar! Streak ${streak}`;
    cur = next;
    draw();
  };
  hi.onclick = () => guess(true);
  lo.onclick = () => guess(false);

  function init() {
    deck = newDeck();
    cur = deck.pop();
    streak = 0;
    ended = false;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Tebak kartu berikutnya";
    draw();
    guard(scr);
  }
  init();
  return { destroy: scr.destroy };
}

/* --------------------------------- YAHTZEE ------------------------------- */
const YCATS = [
  ["ones", "Satu (1)", (d) => d.filter((v) => v === 1).length],
  ["twos", "Dua (2)", (d) => d.filter((v) => v === 2).length * 2],
  ["threes", "Tiga (3)", (d) => d.filter((v) => v === 3).length * 3],
  ["fours", "Empat (4)", (d) => d.filter((v) => v === 4).length * 4],
  ["fives", "Lima (5)", (d) => d.filter((v) => v === 5).length * 5],
  ["sixes", "Enam (6)", (d) => d.filter((v) => v === 6).length * 6],
  ["three", "Three of a Kind", (d) => (countsOf(d).some((n) => n >= 3) ? sum(d) : 0)],
  ["four", "Four of a Kind", (d) => (countsOf(d).some((n) => n >= 4) ? sum(d) : 0)],
  ["full", "Full House (25)", (d) => (countsOf(d).includes(3) && countsOf(d).includes(2) ? 25 : 0)],
  ["small", "Small Straight (30)", (d) => (hasRun(d, 4) ? 30 : 0)],
  ["large", "Large Straight (40)", (d) => (hasRun(d, 5) ? 40 : 0)],
  ["yahtzee", "Yahtzee (50)", (d) => (new Set(d).size === 1 ? 50 : 0)],
  ["chance", "Chance", (d) => sum(d)],
];
const sum = (d) => d.reduce((a, b) => a + b, 0);
const countsOf = (d) => {
  const c = {};
  d.forEach((v) => (c[v] = (c[v] || 0) + 1));
  return Object.values(c);
};
const hasRun = (d, n) => {
  const s = [...new Set(d)].sort((a, b) => a - b);
  let best = 1, cur = 1;
  for (let i = 1; i < s.length; i++) {
    if (s[i] === s[i - 1] + 1) cur++;
    else cur = 1;
    best = Math.max(best, cur);
  }
  return best >= n;
};

function yahtzee(ctx) {
  const { scr, wrap } = mkScreen(ctx, "🎲 Yahtzee", "5 dadu · 3 lemparan · 13 kategori");
  const diceEl = h("div", { class: "dice-row" });
  const stEl = note(wrap, "Lempar dadu untuk mulai");
  const rollBtn = h("button", { class: "btn primary", type: "button", text: "LEMPAR (3)" });
  const catEl = h("div", { class: "cat-list" });
  wrap.append(diceEl, rollBtn, catEl);
  let dice, held, rolls, scores, total, turn;

  const renderDice = () => {
    diceEl.innerHTML = "";
    dice.forEach((v, i) => {
      const el = dieEl(v, held[i] ? " held" : "");
      el.onclick = () => {
        if (rolls === 3 || rolls === 0) return;
        if (!v) return;
        held[i] = !held[i];
        sfx("click");
        renderDice();
        renderCats();
      };
      diceEl.append(el);
    });
  };

  const renderCats = () => {
    catEl.innerHTML = "";
    for (const [key, label, fn] of YCATS) {
      if (scores[key] !== undefined) continue;
      const val = rolls < 3 && dice[0] ? fn(dice) : 0;
      const b = h("button", { class: "cat-btn", type: "button" }, [
        h("span", { text: label }),
        h("b", { text: String(val) }),
      ]);
      b.onclick = () => take(key, fn);
      catEl.append(b);
    }
  };

  const take = (key, fn) => {
    if (rolls === 3 || !dice[0]) return;
    const v = fn(dice);
    scores[key] = v;
    total += v;
    turn++;
    sfx("point");
    scr.setScore(total);
    dice = [0, 0, 0, 0, 0];
    held = [false, false, false, false, false];
    rolls = 3;
    renderDice();
    if (turn >= 13) {
      scr.end({ score: total, title: "Selesai!", sub: `Total ${total} poin`, retry: init });
      return;
    }
    renderCats();
    stEl.textContent = `Total ${total} · pilih kategori berikutnya`;
    rollBtn.textContent = "LEMPAR (3)";
    rollBtn.disabled = false;
  };

  const roll = () => {
    if (rolls <= 0) return;
    if (rolls === 3 && !dice[0]) {
      // lemparan pertama
    }
    for (let i = 0; i < 5; i++) if (!held[i]) dice[i] = randInt(1, 6);
    // lemparan pertama: semua dice 0 dianggap belum dipegang
    rolls--;
    sfx("click");
    renderDice();
    renderCats();
    rollBtn.textContent = rolls ? `LEMPAR (${rolls})` : "PILIH KATEGORI";
    rollBtn.disabled = rolls === 0;
    stEl.textContent = rolls ? "Klik dadu untuk menahan" : "Pilih kategori skor";
  };
  rollBtn.onclick = roll;

  function init() {
    dice = [0, 0, 0, 0, 0];
    held = [false, false, false, false, false];
    rolls = 3;
    scores = {};
    total = 0;
    turn = 0;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Lempar dadu untuk mulai";
    rollBtn.disabled = false;
    rollBtn.textContent = "LEMPAR (3)";
    guard(scr);
    renderDice();
    renderCats();
  }
  init();
  return { destroy: scr.destroy };
}

/* --------------------------------- FARKLE -------------------------------- */
function farkleScore(ds) {
  if (!ds.length) return 0;
  const c = {};
  ds.forEach((v) => (c[v] = (c[v] || 0) + 1));
  let pts = 0;
  const rest = { ...c };
  for (let v = 1; v <= 6; v++) {
    if ((rest[v] || 0) >= 3) {
      pts += v === 1 ? 1000 : v * 100;
      rest[v] -= 3;
    }
  }
  if (ds.length === 6 && [1, 2, 3, 4, 5, 6].every((v) => c[v])) return 1500;
  const pairs = Object.values(c).filter((n) => n >= 2).length;
  if (ds.length === 6 && pairs === 3 && Object.values(c).every((n) => n % 2 === 0)) return 1500;
  pts += (rest[1] || 0) * 100 + (rest[5] || 0) * 50;
  return pts;
}

function farkle(ctx) {
  const { scr, wrap } = mkScreen(ctx, "🎲 Farkle", "Kumpulkan poin, jangan farkle");
  const diceEl = h("div", { class: "dice-row" });
  const stEl = note(wrap, "Lempar 6 dadu");
  const row = h("div", { class: "btn-row wrap" });
  const rollBtn = h("button", { class: "btn", type: "button", text: "LEMPAR" });
  const keepBtn = h("button", { class: "btn primary", type: "button", text: "TAHAN & LEMPAR" });
  const bankBtn = h("button", { class: "btn", type: "button", text: "BANK" });
  row.append(rollBtn, keepBtn, bankBtn);
  wrap.append(diceEl, row);
  let pool, dice, sel, turnPts, total, phase;

  const render = () => {
    diceEl.innerHTML = "";
    dice.forEach((v, i) => {
      const el = dieEl(v, sel.has(i) ? " held" : "");
      el.onclick = () => {
        if (phase !== "pick") return;
        if (sel.has(i)) sel.delete(i);
        else sel.add(i);
        sfx("click");
        render();
        keepBtn.textContent = `TAHAN (${farkleScore([...sel].map((j) => dice[j]))})`;
      };
      diceEl.append(el);
    });
    keepBtn.disabled = phase !== "pick" || !sel.size;
    bankBtn.disabled = phase !== "pick";
    rollBtn.disabled = phase !== "start";
  };

  const doRoll = () => {
    dice = Array.from({ length: pool }, () => randInt(1, 6));
    sel = new Set();
    if (!farkleScore(dice)) {
      sfx("over");
      stEl.textContent = "FARKLE! Poin putaran hangus.";
      turnPts = 0;
      pool = 6;
      dice = [];
      phase = "start";
      render();
      rollBtn.textContent = "LEMPAR LAGI";
      return;
    }
    phase = "pick";
    sfx("click");
    stEl.textContent = "Pilih dadu berpoin, tahan atau bank";
    render();
  };

  rollBtn.onclick = () => {
    if (phase !== "start") return;
    pool = 6;
    turnPts = 0;
    doRoll();
  };
  keepBtn.onclick = () => {
    if (phase !== "pick" || !sel.size) return;
    const pts = farkleScore([...sel].map((j) => dice[j]));
    if (!pts) {
      stEl.textContent = "Dadu itu tidak berpoin.";
      return;
    }
    turnPts += pts;
    pool -= sel.size;
    if (pool <= 0) pool = 6;
    stEl.textContent = `Putaran ${turnPts} · sisa ${pool} dadu`;
    doRoll();
  };
  bankBtn.onclick = () => {
    if (phase !== "pick") return;
    total += turnPts;
    scr.setScore(total);
    sfx("win");
    stEl.textContent = `Bank ${turnPts} · total ${total}`;
    turnPts = 0;
    pool = 6;
    dice = [];
    phase = "start";
    render();
    rollBtn.textContent = "LEMPAR";
  };

  function init() {
    pool = 6;
    dice = [];
    sel = new Set();
    turnPts = 0;
    total = 0;
    phase = "start";
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Lempar 6 dadu";
    rollBtn.textContent = "LEMPAR";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* ----------------------------- SNAKES & LADDERS -------------------------- */
const SNAKES = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

function snakesLadders(ctx) {
  const { scr, wrap } = mkScreen(ctx, "🐍 Ular Tangga", "Ke 100 dulu menang", "min");
  const stEl = note(wrap, "Lempar dadu untuk mulai");
  const board = h("div", { class: "sl-board" });
  setGrid(board, 10, "2px");
  const btn = h("button", { class: "btn primary", type: "button", text: "LEMPAR 🎲" });
  wrap.append(board, btn);
  let me, cpu, turns, locked;

  const render = () => {
    board.innerHTML = "";
    for (let row = 9; row >= 0; row--) {
      for (let col = 0; col < 10; col++) {
        const n = row * 10 + (row % 2 === 0 ? col + 1 : 10 - col);
        const marks = (me === n ? "🟢" : "") + (cpu === n ? "🔴" : "");
        board.append(h("div", { class: "sl-cell" + (n === 100 ? " goal" : "") + (LADDERS[n] ? " ladder" : "") + (SNAKES[n] ? " snake" : "") }, [h("small", { text: String(n) }), h("span", { text: marks })]));
      }
    }
  };

  const move = (pos) => {
    let p = pos + randInt(1, 6);
    if (p > 100) return pos;
    if (LADDERS[p]) {
      sfx("win");
      p = LADDERS[p];
    } else if (SNAKES[p]) {
      sfx("over");
      p = SNAKES[p];
    }
    return p;
  };

  const end = (win) => {
    locked = true;
    scr.end({ score: win ? turns : 0, title: win ? "Kamu menang! 🎉" : "Kalah", sub: `${turns} giliran`, retry: init });
  };

  btn.onclick = () => {
    if (locked) return;
    locked = true;
    turns++;
    me = move(me);
    render();
    stEl.textContent = `Kamu di ${me}`;
    if (me >= 100) return end(true);
    setTimeout(() => {
      cpu = move(cpu);
      render();
      stEl.textContent = `AI di ${cpu} · kamu ${me}`;
      if (cpu >= 100) return end(false);
      locked = false;
    }, 420);
  };

  function init() {
    me = 0;
    cpu = 0;
    turns = 0;
    locked = false;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Lempar dadu untuk mulai";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* --------------------------- TIC TAC TOE 4x4 ----------------------------- */
function tic4(ctx) {
  const N = 4;
  const { scr, wrap } = mkScreen(ctx, "❌ Tic Tac 4×4", "Tiga sejajar menang · kamu X", "min");
  const stEl = note(wrap, "Giliran kamu");
  const board = h("div", { class: "board4" });
  setGrid(board, 4, "3px");
  wrap.append(board);
  let st, locked, moves;

  const lines = () => {
    const L = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N - 2; c++) L.push([r * N + c, r * N + c + 1, r * N + c + 2]);
    for (let c = 0; c < N; c++) for (let r = 0; r < N - 2; r++) L.push([r * N + c, (r + 1) * N + c, (r + 2) * N + c]);
    for (let r = 0; r < N - 2; r++) for (let c = 0; c < N - 2; c++) L.push([r * N + c, (r + 1) * N + c + 1, (r + 2) * N + c + 2]);
    for (let r = 0; r < N - 2; r++) for (let c = 2; c < N; c++) L.push([r * N + c, (r + 1) * N + c - 1, (r + 2) * N + c - 2]);
    return L;
  };
  const LINES = lines();

  const winner = () => {
    for (const [a, b, c] of LINES) if (st[a] && st[a] === st[b] && st[a] === st[c]) return st[a];
    return st.every(Boolean) ? "draw" : null;
  };

  const render = () => {
    board.innerHTML = "";
    for (let i = 0; i < N * N; i++) {
      const el = h("button", { class: "ttt4-cell" + (st[i] ? " v" + st[i] : ""), type: "button", text: st[i] || "" });
      el.onclick = () => play(i);
      board.append(el);
    }
  };

  const aiPick = () => {
    const empties = st.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
    for (const i of empties) {
      st[i] = "O";
      if (winner() === "O") return i;
      st[i] = null;
    }
    for (const i of empties) {
      st[i] = "X";
      if (winner() === "X") return i;
      st[i] = null;
    }
    const pref = [5, 6, 9, 10, 1, 2, 4, 7, 8, 11, 13, 14];
    for (const i of pref) if (empties.includes(i)) return i;
    return pick(empties);
  };

  const after = () => {
    const w = winner();
    if (!w) return false;
    locked = true;
    if (w === "X") {
      scr.end({ score: moves, title: "Menang! 🎉", sub: `${moves} langkah`, retry: init });
    } else {
      scr.end({ score: 0, title: w === "draw" ? "Seri" : "AI menang", sub: `${moves} langkah`, retry: init });
    }
    return true;
  };

  const play = (i) => {
    if (locked || st[i]) return;
    st[i] = "X";
    moves++;
    sfx("flip");
    render();
    if (after()) return;
    locked = true;
    setTimeout(() => {
      const ai = aiPick();
      if (ai !== undefined) st[ai] = "O";
      sfx("tick");
      render();
      if (!after()) {
        locked = false;
        stEl.textContent = "Giliran kamu";
      }
    }, 280);
  };

  function init() {
    st = Array(N * N).fill(null);
    locked = false;
    moves = 0;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Giliran kamu";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* ----------------------------- MEMORY DELUXE ----------------------------- */
const MEM_EMOJI = ["🍎", "🍇", "🍓", "🍒", "🥝", "🍍", "🥑", "🌽", "🍔", "🍕", "🍩", "🍪", "🎈", "🎲", "🚀", "⚽", "🎸", "🐙"];

function memoryDeluxe(ctx) {
  const { scr, wrap } = mkScreen(ctx, "🧠 Memory Deluxe", "6×6 · cocokkan 18 pasang", "min");
  const stEl = note(wrap, "Klik dua kartu");
  const board = h("div", { class: "mem-board" });
  setGrid(board, 6, "3px");
  wrap.append(board);
  let cards, open, matched, moves, locked;

  const render = () => {
    board.innerHTML = "";
    cards.forEach((c, i) => {
      const shown = open.includes(i) || c.done;
      const el = h("button", { class: "mem-cell" + (shown ? " open" : "") + (c.done ? " done" : ""), type: "button", text: shown ? c.e : "" });
      el.onclick = () => flip(i);
      board.append(el);
    });
  };

  const flip = (i) => {
    if (locked || cards[i].done || open.includes(i)) return;
    open.push(i);
    sfx("flip");
    render();
    if (open.length < 2) return;
    moves++;
    const [a, b] = open;
    if (cards[a].e === cards[b].e) {
      cards[a].done = cards[b].done = true;
      matched++;
      open = [];
      sfx("point");
      stEl.textContent = `Cocok! ${matched}/18 · ${moves} langkah`;
      render();
      if (matched === MEM_EMOJI.length) {
        locked = true;
        setTimeout(() => scr.end({ score: moves, title: "Semua cocok! 🎉", sub: `${moves} langkah`, retry: init }), 350);
      }
    } else {
      locked = true;
      setTimeout(() => {
        open = [];
        locked = false;
        render();
      }, 620);
    }
  };

  function init() {
    const pool = shuffle([...MEM_EMOJI, ...MEM_EMOJI]);
    cards = pool.map((e) => ({ e, done: false }));
    open = [];
    matched = 0;
    moves = 0;
    locked = false;
    scr.hideOverlay();
    scr.setScore(0);
    stEl.textContent = "Klik dua kartu";
    guard(scr);
    render();
  }
  init();
  return { destroy: scr.destroy };
}

/* -------------------------------- EXPORTS -------------------------------- */
export const board = [
  { id: "checkers", name: "Checkers", emoji: "⚫", tag: "Board", desc: "Catur dam melawan AI, tangkap semua bidak.", bestMode: "max", mount: checkers },
  { id: "reversi", name: "Reversi", emoji: "⚪", tag: "Board", desc: "Kepung bidak lawan, kuasai papan 8×8.", bestMode: "max", mount: reversi },
  { id: "gomoku", name: "Gomoku", emoji: "⭕", tag: "Board", desc: "Lima batu sejajar menang melawan AI.", bestMode: "max", mount: gomoku },
  { id: "dots-boxes", name: "Dots & Boxes", emoji: "🔵", tag: "Board", desc: "Tutup kotak terbanyak di papan titik.", bestMode: "max", mount: dotsBoxes },
  { id: "battleship", name: "Battleship", emoji: "🚢", tag: "Board", desc: "Tenggelamkan armada musuh di grid 10×10.", bestMode: "max", mount: battleship },
  { id: "blackjack", name: "Blackjack", emoji: "🂡", tag: "Board", desc: "Kejar 21 tanpa lewat, kredit virtual.", bestMode: "max", mount: blackjack },
  { id: "video-poker", name: "Video Poker", emoji: "🃏", tag: "Board", desc: "Jacks or Better dengan tahan kartu.", bestMode: "max", mount: videoPoker },
  { id: "war", name: "War", emoji: "⚔️", tag: "Board", desc: "Adu kartu sampai dek lawan habis.", bestMode: "max", mount: war },
  { id: "high-low", name: "High Low", emoji: "📈", tag: "Board", desc: "Tebak kartu berikutnya, kejar streak.", bestMode: "max", mount: highLow },
  { id: "yahtzee", name: "Yahtzee", emoji: "🎲", tag: "Board", desc: "5 dadu, 13 kategori, skor maksimal.", bestMode: "max", mount: yahtzee },
  { id: "farkle", name: "Farkle", emoji: "🎲", tag: "Board", desc: "Kumpulkan dadu berpoin lalu bank.", bestMode: "max", mount: farkle },
  { id: "snakes-ladders", name: "Snakes & Ladders", emoji: "🐍", tag: "Board", desc: "Balapan ke 100 melawan AI.", bestMode: "min", mount: snakesLadders },
  { id: "tic-tac-4", name: "Tic Tac 4×4", emoji: "❌", tag: "Board", desc: "Tiga sejajar di papan 4×4.", bestMode: "min", mount: tic4 },
  { id: "memory-deluxe", name: "Memory Deluxe", emoji: "🧠", tag: "Board", desc: "Cocokkan 18 pasang dengan langkah minim.", bestMode: "min", mount: memoryDeluxe },
];
