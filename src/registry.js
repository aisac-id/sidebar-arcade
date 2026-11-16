import snake from "./games/snake.js";
import tetris from "./games/tetris.js";
import bounce2048 from "./games/2048.js";
import breakout from "./games/breakout.js";
import flappy from "./games/flappy.js";
import memory from "./games/memory.js";
import mines from "./games/mines.js";
import pong from "./games/pong.js";
import tictactoe from "./games/tictactoe.js";
import invaders from "./games/invaders.js";
import dodge from "./games/dodge.js";
import whack from "./games/whack.js";
import reaction from "./games/reaction.js";
import connect4 from "./games/connect4.js";
import simon from "./games/simon.js";

export const GAMES = [
  snake,
  tetris,
  bounce2048,
  breakout,
  flappy,
  invaders,
  dodge,
  pong,
  memory,
  mines,
  tictactoe,
  connect4,
  simon,
  whack,
  reaction,
];

export const CATEGORY_ORDER = ["Arcade", "Puzzle", "Board", "Reflex"];
