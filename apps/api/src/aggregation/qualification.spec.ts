import { describe, expect, it } from 'vitest';
import { isQualified } from './qualification.js';

// 시즌47 기준 (Season 기본값): minGames=38, minMinutesPerGame=15
describe('isQualified', () => {
  it('passes a full-season starter', () => {
    // 자밀 워니: 50경기, 101089초 = 평균 33.7분/경기
    expect(isQualified(50, 101089, 38, 15)).toBe(true);
  });

  it('fails a player who played too few games', () => {
    expect(isQualified(10, 10 * 20 * 60, 38, 15)).toBe(false); // 경기당 20분이어도 10경기뿐
  });

  it('fails a garbage-time player with plenty of games but few minutes', () => {
    expect(isQualified(40, 40 * 5 * 60, 38, 15)).toBe(false); // 경기당 5분
  });

  it('rejects the 0-game / 0-second edge case without dividing by zero', () => {
    expect(isQualified(0, 0, 38, 15)).toBe(false);
  });
});
