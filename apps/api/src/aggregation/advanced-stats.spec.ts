import { describe, expect, it } from 'vitest';
import {
  assistPct,
  effectiveFgPct,
  trueShootingPct,
  turnoverPct,
  usagePct,
} from './advanced-stats.js';

// 시즌47(2025-26) 실제 DB 값 — 자밀 워니(서울 SK) 시즌 합계.
const warney = {
  seconds: 101089,
  fga: 1091,
  fta: 161,
  tov: 94,
  ast: 238,
  fgm: 482,
};
const sk = { seconds: 654000, fga: 3590, fta: 829, tov: 522, fgm: 1579 };

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

describe('usagePct', () => {
  it('matches spike-reported 표준 공식 값 (36.3%, 팀=시즌 전체 합계 기준)', () => {
    const usg = usagePct(
      warney.fga,
      warney.fta,
      warney.tov,
      warney.seconds,
      sk.seconds,
      sk.fga,
      sk.fta,
      sk.tov,
    );
    // spike/README.md 4장: "API는 7.2%를 주지만 표준 공식은 36.3%다."
    expect(usg).toBeCloseTo(36.3, 1);
  });

  it('returns null when the player played 0 seconds', () => {
    expect(usagePct(0, 0, 0, 0, sk.seconds, sk.fga, sk.fta, sk.tov)).toBeNull();
  });
});

describe('assistPct', () => {
  it('computes a plausible share of teammate field goals assisted', () => {
    const ast = assistPct(
      warney.ast,
      warney.fgm,
      warney.seconds,
      sk.seconds,
      sk.fgm,
    );
    expect(ast).toBeCloseTo(32.24, 1);
  });

  it('returns null when the team played 0 seconds', () => {
    expect(assistPct(warney.ast, warney.fgm, warney.seconds, 0, sk.fgm)).toBeNull();
  });
});
