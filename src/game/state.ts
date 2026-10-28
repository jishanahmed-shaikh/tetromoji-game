import { PieceBag, type PieceType } from './pieces';

export const COLS = 10;
export const ROWS = 20;
export const CELL = 54;
export const BOARD_W = 720;
export const BOARD_H = 1280;
export const GRID_X = (BOARD_W - COLS * CELL) / 2; // 90
export const GRID_Y = 180;
export const LOCK_DELAY_S = 0.3;
export const BASE_DROP_S = 0.8;
export const MIN_DROP_S = 0.1;
export const DROP_PER_LEVEL_S = 0.07;
export const LINES_PER_LEVEL = 10;

export type Phase = 'TITLE' | 'PLAYING' | 'GAME_OVER';

export interface ActivePiece {
  type: PieceType;
  rotation: number;
  col: number;
  row: number;
}

export interface GameState {
  phase: Phase;
  board: (PieceType | null)[][]; // [row][col]
  active: ActivePiece;
  next: PieceType;
  bag: PieceBag;
  score: number;
  lines: number;
  level: number;
  dropTimer: number;
  lockTimer: number;
  grounded: boolean;
}

function emptyBoard(): (PieceType | null)[][] {
  return Array.from({ length: ROWS }, () => Array<PieceType | null>(COLS).fill(null));
}

export function spawnPiece(type: PieceType): ActivePiece {
  return { type, rotation: 0, col: 3, row: 0 };
}

export function createGame(): GameState {
  const bag = new PieceBag();
  return {
    phase: 'TITLE',
    board: emptyBoard(),
    active: spawnPiece(bag.next()),
    next: bag.next(),
    bag,
    score: 0,
    lines: 0,
    level: 1,
    dropTimer: 0,
    lockTimer: 0,
    grounded: false,
  };
}

export function restart(state: GameState): void {
  state.board = emptyBoard();
  state.bag = new PieceBag();
  state.active = spawnPiece(state.bag.next());
  state.next = state.bag.next();
  state.score = 0;
  state.lines = 0;
  state.level = 1;
  state.dropTimer = 0;
  state.lockTimer = 0;
  state.grounded = false;
  state.phase = 'PLAYING';
}

export function dropIntervalS(level: number): number {
  return Math.max(MIN_DROP_S, BASE_DROP_S - (level - 1) * DROP_PER_LEVEL_S);
}
