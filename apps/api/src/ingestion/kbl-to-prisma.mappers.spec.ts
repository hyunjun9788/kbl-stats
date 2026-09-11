import { describe, expect, it } from 'vitest';
import type {
  KblBoxScoreEntryRaw,
  KblMatchRaw,
  KblTeamRecordEntryRaw,
} from '../kbl-api/kbl-api.types.js';
import {
  isKblRegularSeason,
  selectMatches,
  toGameKickoff,
  toGameUpsert,
  toPlayerGameStatValues,
  toPlayerUpsert,
  toSeasonUpsert,
  toTeamGameStatValues,
} from './kbl-to-prisma.mappers.js';

// 2026-02-10 S47G01N196 (대구 한국가스공사 72 : 71 창원 LG) 실제 응답에서 발췌.
const heoIlyoung: KblBoxScoreEntryRaw = {
  player: {
    pcode: '290284',
    pname: '허일영',
    ename: 'HEO ILYOUNG',
    tcode: '50',
    tname: '창원 LG',
    backNum: '11',
    pos: 'FD',
  },
  records: {
    score: 3,
    fg: 0,
    fgA: 0,
    threep: 1,
    threepA: 4,
    fgt: 1,
    fgtA: 4,
    ft: 0,
    ftA: 0,
    offr: 0,
    defr: 0,
    rb: 0,
    ast: 1,
    stl: 0,
    bs: 1,
    to: 0,
    foul: 0,
    playMin: 19,
    playSec: 58,
    marginCn: -5,
    per: 5.3,
    pie: 2.3,
    tsRt: 37.5,
    efgRt: 37.5,
    usgRt: 9.9,
    astRt: 7.4,
    tovRt: 0,
  },
  homeAway: '2',
  startFlag: 0,
};

describe('toPlayerGameStatValues', () => {
  const v = toPlayerGameStatValues(heoIlyoung);

  it('splits KBL field names correctly (fgt=total, fg=2P, threep=3P, bs=blk, to=tov)', () => {
    expect(v.fgm).toBe(1);
    expect(v.fga).toBe(4);
    expect(v.fg2m).toBe(0);
    expect(v.fg3m).toBe(1);
    expect(v.blk).toBe(1);
    expect(v.tov).toBe(0);
    expect(v.pf).toBe(0);
  });

  it('converts playMin:playSec to total seconds', () => {
    expect(v.secondsPlayed).toBe(19 * 60 + 58);
  });

  it('reads home/away and starter flags', () => {
    expect(v.isHome).toBe(false); // homeAway "2" = 원정
    expect(v.isStarter).toBe(false);
  });

  it('keeps jersey number as a per-game string', () => {
    expect(v.jerseyNumber).toBe('11');
  });

  it('carries KBL advanced stats into src* columns (0 is a real value, not null)', () => {
    expect(v.srcTsPct).toBe(37.5);
    expect(v.srcUsgPct).toBe(9.9);
    expect(v.srcTovPct).toBe(0);
    expect(v.plusMinus).toBe(-5);
  });
});

describe('toPlayerUpsert', () => {
  it('uses pcode as kblPlayerNo and keeps raw position', () => {
    expect(toPlayerUpsert(heoIlyoung)).toEqual({
      kblPlayerNo: '290284',
      koreanName: '허일영',
      englishName: 'HEO ILYOUNG',
      position: 'FD',
    });
  });
});

describe('toTeamGameStatValues', () => {
  const lg: KblTeamRecordEntryRaw = {
    tcode: '50',
    records: {
      score: 71,
      fg: 21,
      fgA: 38,
      threep: 7,
      threepA: 30,
      fgt: 28,
      fgtA: 68,
      ft: 8,
      ftA: 12,
      offr: 10,
      defr: 26,
      rb: 36,
      ast: 23,
      stl: 7,
      bs: 5,
      to: 8,
      foul: 17,
      playMin: 200,
      playSec: 0,
    },
  };

  it('resolves team total seconds to 40min x 5 players = 12000', () => {
    expect(toTeamGameStatValues(lg, false).secondsPlayed).toBe(12000);
  });

  it('maps totals', () => {
    const v = toTeamGameStatValues(lg, true);
    expect(v).toMatchObject({ isHome: true, points: 71, fgm: 28, fga: 68, reb: 36 });
  });
});

describe('toGameKickoff', () => {
  it('parses YYYYMMDD + HHmm as KST', () => {
    expect(toGameKickoff('20260210', '1900').toISOString()).toBe(
      '2026-02-10T10:00:00.000Z',
    );
  });
});

describe('isKblRegularSeason', () => {
  const base = { seasonCategory: 'R', gameCode: '01' } as KblMatchRaw;

  it('accepts R / 01', () => {
    expect(isKblRegularSeason(base)).toBe(true);
  });

  it('rejects D-league', () => {
    expect(isKblRegularSeason({ ...base, seasonCategory: 'D1' })).toBe(false);
  });
});

describe('selectMatches', () => {
  const regularA = {
    gmkey: 'S47G01N196',
    seasonCategory: 'R',
    gameCode: '01',
  } as KblMatchRaw;
  const regularB = {
    gmkey: 'S47G01N197',
    seasonCategory: 'R',
    gameCode: '01',
  } as KblMatchRaw;
  const dLeague = {
    gmkey: 'S48G01N59',
    seasonCategory: 'D1',
    gameCode: '01',
  } as KblMatchRaw;
  const matches = [regularA, dLeague, regularB];

  it('without gmkey: returns every KBL regular-season match, dropping D-league rows', () => {
    expect(selectMatches(matches)).toEqual([regularA, regularB]);
  });

  it('with gmkey: returns just that one match', () => {
    expect(selectMatches(matches, 'S47G01N197')).toEqual([regularB]);
  });

  it('with an unknown gmkey: returns an empty array rather than throwing', () => {
    expect(selectMatches(matches, 'NOPE')).toEqual([]);
  });

  it('with a D-league gmkey: still excluded, because it is not a regular-season game', () => {
    expect(selectMatches(matches, 'S48G01N59')).toEqual([]);
  });
});

describe('toSeasonUpsert', () => {
  it('derives startYear from the season name', () => {
    expect(
      toSeasonUpsert({ seasonCode: 47, seasonName1: '2025-2026' }),
    ).toEqual({ kblSeasonCode: 47, name: '2025-2026', startYear: 2025 });
  });
});

describe('toGameUpsert', () => {
  it('maps a regular-season match row', () => {
    const match = {
      gmkey: 'S47G01N196',
      seasonCategory: 'R',
      gameCode: '01',
      gameDate: '20260210',
      gameStart: '1900',
      scoreH: 72,
      scoreA: 71,
      isEnded: 1,
      stadiumname: '대구',
    } as KblMatchRaw;
    expect(toGameUpsert(match)).toMatchObject({
      gmkey: 'S47G01N196',
      tipOff: '19:00',
      stadium: '대구',
      homeScore: 72,
      awayScore: 71,
      isEnded: true,
      gameType: 'REGULAR',
      kblSeasonCategory: 'R',
      kblGameCode: '01',
    });
  });
});
