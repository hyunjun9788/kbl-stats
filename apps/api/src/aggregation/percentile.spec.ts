import { describe, expect, it } from 'vitest';
import { rankAndPercentile } from './percentile.js';

/** id 1이 최고값, id 61이 최저값인 61명짜리 가상 모집단. */
function population(size: number) {
  return Array.from({ length: size }, (_, i) => ({ id: i + 1, value: size - i }));
}

describe('rankAndPercentile', () => {
  // 아래 4개는 plan.md 2.1/2.2 장에 실제로 적힌 예시 숫자를 그대로 검증한다.
  it('PTS: 61명 중 3위 → 상위 5%', () => {
    const third = rankAndPercentile(population(61), true).find((r) => r.rank === 3);
    expect(third?.percentileBucket).toBe(5);
  });

  it('AST: 61명 중 2위 → 상위 5%', () => {
    const second = rankAndPercentile(population(61), true).find((r) => r.rank === 2);
    expect(second?.percentileBucket).toBe(5);
  });

  it('TS%: 61명 중 12위 → 상위 20%', () => {
    const twelfth = rankAndPercentile(population(61), true).find((r) => r.rank === 12);
    expect(twelfth?.percentileBucket).toBe(20);
  });

  it('USG%: 61명 중 6위 → 상위 10%', () => {
    const sixth = rankAndPercentile(population(61), true).find((r) => r.rank === 6);
    expect(sixth?.percentileBucket).toBe(10);
  });

  it('1위도 "상위 0%"가 아니라 최소 5%로 clamp된다', () => {
    const best = rankAndPercentile(population(61), true).find((r) => r.rank === 1);
    expect(best?.percentileBucket).toBeGreaterThanOrEqual(5);
  });

  it('higherIsBetter=false 면 값이 작을수록 rank 1 (TOV% 같은 지표)', () => {
    const entries = [
      { id: 1, value: 20 },
      { id: 2, value: 5 },
      { id: 3, value: 10 },
    ];
    const ranked = rankAndPercentile(entries, false);
    expect(ranked.find((r) => r.id === 2)?.rank).toBe(1);
    expect(ranked.find((r) => r.id === 1)?.rank).toBe(3);
  });
});
