import { COLS, ROWS, type ActivePiece } from './state';
import { pieceCells } from './pieces';

export function fits(board: (string | null)[][], piece: ActivePiece): boolean {
  for (const c of pieceCells(piece.type, piece.rotation)) {
    const x = piece.col + c.x;
    const y = piece.row + c.y;
    if (x < 0 || x >= COLS || y >= ROWS) return false;
    if (y >= 0 && board[y]![x] !== null) return false;
  }
  return true;
}

/** How far the piece can drop before it collides, for the ghost piece and hard drop. */
export function dropDistance(board: (string | null)[][], piece: ActivePiece): number {
  let d = 0;
  while (fits(board, { ...piece, row: piece.row + d + 1 })) d++;
  return d;
}

export function lockPiece(board: (string | null)[][], piece: ActivePiece): void {
  for (const c of pieceCells(piece.type, piece.rotation)) {
    const x = piece.col + c.x;
    const y = piece.row + c.y;
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) board[y]![x] = piece.type;
  }
}

/** Returns the full row indices, so they can be flashed before being removed. */
export function findFullRows(board: (string | null)[][]): number[] {
  const rows: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    if (board[y]!.every((cell) => cell !== null)) rows.push(y);
  }
  return rows;
}

export function clearRows(board: (string | null)[][], rows: number[]): void {
  for (const y of rows.slice().sort((a, b) => b - a)) board.splice(y, 1);
  while (board.length < ROWS) board.unshift(Array<string | null>(COLS).fill(null));
}

export function scoreForLines(count: number, level: number): number {
  const base = [0, 100, 300, 500, 800][count] ?? 0;
  return base * level;
}
