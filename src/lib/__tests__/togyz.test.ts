import { describe, expect, it } from 'vitest';
import { botMove, initial, legalMoves, move } from '../../games/togyz';

describe('тоғызқұмалақ-мини', () => {
  it('басында 50 құмалақ, 5 жүріс', () => {
    const s = initial();
    expect(s.board.reduce((a, b) => a + b, 0)).toBe(50);
    expect(legalMoves(s)).toEqual([0, 1, 2, 3, 4]);
  });
  it('тарату алынған отаудан басталады', () => {
    const s = move(initial(), 0); // 5 құмалақ: 0,1,2,3,4 отауларына
    expect(s.board.slice(0, 5)).toEqual([1, 6, 6, 6, 6]);
    expect(s.turn).toBe(1);
  });
  it('қарсыластың отауында жұп сан болса — ұтады', () => {
    const s = move(initial(), 2); // 2,3,4,5,6 → 6-отау (Бота) 6 болады — жұп
    expect(s.kazan[0]).toBe(6);
    expect(s.board[6]).toBe(0);
  });
  it('құмалақ саны сақталады', () => {
    let s = initial();
    for (let i = 0; i < 40 && !s.over; i++) s = move(s, s.turn === 1 ? botMove(s) : legalMoves(s)[0]);
    expect(s.board.reduce((a, b) => a + b, 0) + s.kazan[0] + s.kazan[1]).toBe(50);
  });
});
