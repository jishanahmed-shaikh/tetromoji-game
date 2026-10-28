import { describe, expect, it } from 'vitest';
import { PIECE_TYPES, PieceBag, pieceCells } from '../src/game/pieces';

describe('pieceCells', () => {
  it('every piece has exactly 4 cells in every rotation', () => {
    for (const type of PIECE_TYPES) {
      for (let r = 0; r < 4; r++) {
        expect(pieceCells(type, r)).toHaveLength(4);
      }
    }
  });

  it('wraps negative and large rotation indices into 0-3', () => {
    expect(pieceCells('T', -1)).toEqual(pieceCells('T', 3));
    expect(pieceCells('T', 4)).toEqual(pieceCells('T', 0));
  });

  it('the O piece is identical in every rotation', () => {
    expect(pieceCells('O', 0)).toEqual(pieceCells('O', 2));
  });
});

describe('PieceBag', () => {
  it('deals each of the 7 pieces exactly once before repeating', () => {
    const bag = new PieceBag();
    const seen = new Set(Array.from({ length: 7 }, () => bag.next()));
    expect(seen.size).toBe(7);
    for (const type of PIECE_TYPES) expect(seen.has(type)).toBe(true);
  });

  it('refills after exhausting a bag', () => {
    const bag = new PieceBag();
    const first14 = Array.from({ length: 14 }, () => bag.next());
    expect(new Set(first14.slice(0, 7)).size).toBe(7);
    expect(new Set(first14.slice(7, 14)).size).toBe(7);
  });
});
