import type { Input } from './input';
import {
  LINES_PER_LEVEL,
  LOCK_DELAY_S,
  dropIntervalS,
  restart,
  spawnPiece,
  type GameState,
} from './state';
import { pieceCells } from './pieces';
import { clearRows, dropDistance, findFullRows, fits, lockPiece, scoreForLines } from './physics';

export interface LoopHooks {
  onRotate(): void;
  onLock(): void;
  onLinesCleared(count: number): void;
  onHardDrop(): void;
  onLevelUp(): void;
  onGameOver(score: number): void;
}

function tryMove(state: GameState, dx: number, dy: number): boolean {
  const moved = { ...state.active, col: state.active.col + dx, row: state.active.row + dy };
  if (!fits(state.board, moved)) return false;
  state.active = moved;
  return true;
}

function tryRotate(state: GameState): boolean {
  const rotation = (state.active.rotation + 1) % 4;
  for (const kick of [0, 1, -1, 2, -2]) {
    const candidate = { ...state.active, rotation, col: state.active.col + kick };
    if (fits(state.board, candidate)) {
      state.active = candidate;
      return true;
    }
  }
  return false;
}

function settlePiece(state: GameState, hooks: LoopHooks): void {
  lockPiece(state.board, state.active);
  hooks.onLock();

  const full = findFullRows(state.board);
  if (full.length > 0) {
    clearRows(state.board, full);
    state.score += scoreForLines(full.length, state.level);
    state.lines += full.length;
    hooks.onLinesCleared(full.length);
    const newLevel = Math.floor(state.lines / LINES_PER_LEVEL) + 1;
    if (newLevel > state.level) {
      state.level = newLevel;
      hooks.onLevelUp();
    }
  }

  const next = spawnPiece(state.next);
  state.next = state.bag.next();
  state.dropTimer = 0;
  state.lockTimer = 0;
  state.grounded = false;
  if (!fits(state.board, next)) {
    state.phase = 'GAME_OVER';
    hooks.onGameOver(state.score);
    return;
  }
  state.active = next;
}

export function step(state: GameState, input: Input, dt: number, hooks: LoopHooks): void {
  if (state.phase === 'TITLE') {
    if (input.consumeTap()) restart(state);
    return;
  }
  if (state.phase === 'GAME_OVER') {
    if (input.consumeTap()) restart(state);
    return;
  }

  // Drag: snap toward the finger's column, one step at a time so collisions still apply.
  if (input.dragCol !== null) {
    let guard = COLS_GUARD;
    while (guard-- > 0 && state.active.col !== input.dragCol) {
      const dir = input.dragCol > state.active.col ? 1 : -1;
      if (!tryMove(state, dir, 0)) break;
    }
  }

  if (input.consumeTap()) {
    if (tryRotate(state)) hooks.onRotate();
  }

  if (input.consumeHardDrop()) {
    const d = dropDistance(state.board, state.active);
    state.active = { ...state.active, row: state.active.row + d };
    state.score += d * 2;
    hooks.onHardDrop();
    settlePiece(state, hooks);
    return;
  }

  const canFall = fits(state.board, { ...state.active, row: state.active.row + 1 });
  if (canFall) {
    state.grounded = false;
    state.lockTimer = 0;
    state.dropTimer += dt;
    if (state.dropTimer >= dropIntervalS(state.level)) {
      state.dropTimer = 0;
      state.active = { ...state.active, row: state.active.row + 1 };
    }
  } else {
    state.grounded = true;
    state.lockTimer += dt;
    if (state.lockTimer >= LOCK_DELAY_S) {
      settlePiece(state, hooks);
    }
  }
}

const COLS_GUARD = 12; // more than a board's width of columns, so the drag catch-up loop always ends

export function ghostRow(state: GameState): number {
  return state.active.row + dropDistance(state.board, state.active);
}

export function activePieceCells(state: GameState) {
  return pieceCells(state.active.type, state.active.rotation);
}
