import { describe, expect, it } from 'vitest';
import { effectiveFgPct, trueShootingPct, turnoverPct } from './advanced-stats.js';

describe('trueShootingPct', () => {
  it('matches the spike-verified 자밀 워니 시즌 값 (오차 0.01 이내)', () => {
    // spike/README.md 4장: 1158 / (2 × (1091 + 0.44×161)) = 49.83, KBL API 값과 완전 일치.
    expect(trueShootingPct(1158, 1091, 161)).toBeCloseTo(49.83, 1);
  });

  it('returns null instead of dividing by zero', () => {
    expect(trueShootingPct(0, 0, 0)).toBeNull();
  });
});

describe('effectiveFgPct', () => {
  it('weights 3-pointers at 1.5x makes', () => {
    // 10/20 야투, 그중 4개가 3점 → (10 + 0.5×4) / 20 × 100 = 60
    expect(effectiveFgPct(10, 4, 20)).toBeCloseTo(60, 5);
  });

  it('returns null when there were no field goal attempts', () => {
    expect(effectiveFgPct(0, 0, 0)).toBeNull();
  });
});

describe('turnoverPct', () => {
  it('computes turnovers per estimated possession', () => {
    // TOV / (FGA + 0.44FTA + TOV) × 100
    expect(turnoverPct(5, 15, 10)).toBeCloseTo((5 / (15 + 4.4 + 5)) * 100, 5);
  });

  it('returns null when the player never used a possession', () => {
    expect(turnoverPct(0, 0, 0)).toBeNull();
  });
});
