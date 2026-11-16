// Pack keberuntungan (dingdong): slot, roulette, dadu, roda, koin, keno, dll.
import {
  createSlots,
  createRoulette,
  createDice,
  createPlinko,
  createWheel,
  createCoin,
  createKeno,
  createScratch,
  createBingo,
} from "../lib/engines/casino.js";

const cfgFor = (emoji, name, desc, extra = {}) => ({
  title: `${emoji} ${name}`,
  subtitle: desc,
  credits: 150,
  hint: "Pilih taruhan lalu tekan tombol utama.",
  ...extra,
});

const slot = (id, name, emoji, desc, symbols, pays) => ({
  id,
  name,
  emoji,
  tag: "Luck",
  desc,
  bestMode: "max",
  mount: (ctx) => createSlots(ctx, cfgFor(emoji, name, desc, { symbols, pays })),
});

const plain = (id, name, emoji, desc, fn) => ({
  id,
  name,
  emoji,
  tag: "Luck",
  desc,
  bestMode: "max",
  mount: (ctx) => fn(ctx, cfgFor(emoji, name, desc)),
});

export const luck = [
  slot("slot-machine", "Slot Machine", "🎰", "Dingdong klasik 3 reel, cari jackpot.", ["🍒", "🍋", "🔔", "⭐", "7️⃣", "💎"], [5, 6, 8, 12, 20, 32]),
  slot("fruit-slot", "Fruit Slot", "🍉", "Slot buah segar dengan bayaran manis.", ["🍉", "🍇", "🍊", "🍓", "🍍", "🥝"], [4, 5, 7, 10, 16, 26]),
  slot("lucky-seven", "Lucky Seven", "7️⃣", "Tiga tujuh bikin kredit meledak.", ["🍀", "🔔", "💎", "👑", "⭐", "7️⃣"], [4, 6, 9, 14, 24, 50]),
  plain("roulette", "Roulette", "🎡", "Merah, hitam, ganjil, genap, atau nol.", createRoulette),
  plain("dice-over-under", "Dice Over Under", "🎲", "Dua dadu: besar, kecil, atau tepat 7.", createDice),
  plain("plinko", "Plinko", "🔻", "Jatuhkan bola, pantul ke pengali besar.", createPlinko),
  plain("spin-wheel", "Spin Wheel", "🎯", "Putar roda keberuntungan untuk pengali.", createWheel),
  plain("coin-flip", "Coin Flip", "🪙", "Kepala atau ekor, dobel atau hangus.", createCoin),
  plain("keno", "Keno", "🔢", "Pilih 5 dari 20 angka, cocokkan undian.", createKeno),
  plain("scratch-card", "Scratch Card", "🪙", "Gosok kartu, cocokkan tiga simbol.", createScratch),
  plain("bingo", "Bingo", "🎟️", "Tandai kartu 5×5 sebelum lawan.", createBingo),
];
