import { describe, expect, it } from 'vitest';
import { clearRows, dropDistance, findFullRows, fits, lockPiece, scoreForLines } from '../src/game/physics';
import { COLS, ROWS, spawnPiece } from '../src/game/state';

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
}

describe('fits', () => {
  it('accepts a freshly spawned piece on an empty board', () => {
    expect(fits(emptyBoard(), spawnPiece('T'))).toBe(true);
  });

  it('rejects a piece that would go past the left wall', () => {
    expect(fits(emptyBoard(), { ...spawnPiece('I'), col: -1 })).toBe(false);
  });

  it('rejects a piece that would go past the right wall', () => {
    expect(fits(emptyBoard(), { ...spawnPiece('I'), col: COLS - 1 })).toBe(false);
  });

  it('rejects a piece overlapping an occupied cell', () => {
    const board = emptyBoard();
    board[1]![4] = 'O';
    // O-piece at col 3 occupies (4,0)(5,0)(4,1)(5,1) in its box — collides with the filled cell.
    expect(fits(board, spawnPiece('O'))).toBe(false);
  });

  it('rejects a piece past the floor', () => {
    expect(fits(emptyBoard(), { ...spawnPiece('O'), row: ROWS })).toBe(false);
  });
});

describe('dropDistance', () => {
  it('is the full board height for an empty board, minus the piece height', () => {
    const board = emptyBoard();
    const piece = spawnPiece('O'); // occupies rows 0-1 of its box
    expect(dropDistance(board, piece)).toBe(ROWS - 2);
  });

  it('stops right above a stack', () => {
    const board = emptyBoard();
    board[ROWS - 1]!.fill('I');
    const piece = spawnPiece('O');
    expect(dropDistance(board, piece)).toBe(ROWS - 3);
  });
});

describe('findFullRows / clearRows', () => {
  it('finds exactly the rows with every cell filled', () => {
    const board = emptyBoard();
    board[5]!.fill('I');
    board[10]!.fill('T');
    board[10]![3] = null;
    expect(findFullRows(board)).toEqual([5]);
  });

  it('removes full rows and keeps the board at ROWS tall with empty rows added on top', () => {
    const board = emptyBoard();
    board[ROWS - 1]!.fill('I');
    board[ROWS - 2]![0] = 'T';
    clearRows(board, [ROWS - 1]);
    expect(board.length).toBe(ROWS);
    expect(board[0]!.every((c) => c === null)).toBe(true);
    expect(board[ROWS - 1]![0]).toBe('T'); // the surviving row shifted down
  });
});

describe('lockPiece', () => {
  it('writes the piece type into every one of its cells', () => {
    const board = emptyBoard();
    lockPiece(board, spawnPiece('O'));
    expect(board[0]![4]).toBe('O');
    expect(board[0]![5]).toBe('O');
    expect(board[1]![4]).toBe('O');
    expect(board[1]![5]).toBe('O');
  });
});

describe('scoreForLines', () => {
  it('scores a single, double, triple, and tetris with the classic table, scaled by level', () => {
    expect(scoreForLines(1, 1)).toBe(100);
    expect(scoreForLines(2, 1)).toBe(300);
    expect(scoreForLines(3, 1)).toBe(500);
    expect(scoreForLines(4, 1)).toBe(800);
    expect(scoreForLines(4, 3)).toBe(2400);
  });

  it('scores zero lines as zero', () => {
    expect(scoreForLines(0, 5)).toBe(0);
  });
});
