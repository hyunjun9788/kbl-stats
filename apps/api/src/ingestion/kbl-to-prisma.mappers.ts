/**
 * KBL 원본 응답 → Prisma upsert 입력값으로 바꾸는 순수 함수 모음.
 * 네트워크도 DB도 모른다. 단위 테스트의 핵심 대상.
 *
 * KBL 필드 매핑 메모:
 *   - fgt/fgtA = 전체 야투, fg/fgA = 2점만, threep/threepA = 3점
 *   - bs = 블록, to = 턴오버, foul = 파울, marginCn = +/-
 *   - playMin:playSec 는 "분:초" (예: 19:58 → 1198초)
 *   - 팀 기록은 playMin=200, playSec=0 → 12000초 (40분 × 5명)
 */
import type {
  KblBoxScoreEntryRaw,
  KblMatchRaw,
  KblRecordRaw,
  KblSeasonRaw,
  KblTeamRecordEntryRaw,
  KblTeamTraditionalRaw,
} from '../kbl-api/kbl-api.types.js';

export const REGULAR_SEASON_CATEGORY = 'R';
export const REGULAR_SEASON_GAME_CODE = '01';

export type GameType =
  | 'REGULAR'
  | 'PLAYOFF'
  | 'CHAMPIONSHIP'
  | 'PRESEASON'
  | 'ALLSTAR'
  | 'OTHER';

const num = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const opt = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const playedSeconds = (r: KblRecordRaw): number =>
  num(r.playMin) * 60 + num(r.playSec);

/** "2025-2026" → 2025 */
function seasonStartYear(name: string): number {
  const year = Number.parseInt(name.slice(0, 4), 10);
  return Number.isFinite(year) ? year : 0;
}

export interface SeasonUpsert {
  kblSeasonCode: number;
  name: string;
  startYear: number;
}

export function toSeasonUpsert(raw: KblSeasonRaw): SeasonUpsert {
  return {
    kblSeasonCode: raw.seasonCode,
    name: raw.seasonName1,
    startYear: seasonStartYear(raw.seasonName1),
  };
}

export interface TeamUpsert {
  kblTeamCode: string;
  name: string;
  shortName: string;
}

export function toTeamUpsert(raw: KblTeamTraditionalRaw): TeamUpsert {
  return {
    kblTeamCode: raw.teamCode,
    name: raw.teamName1,
    shortName: raw.teamName4,
  };
}

export function isKblRegularSeason(match: KblMatchRaw): boolean {
  return (
    match.seasonCategory === REGULAR_SEASON_CATEGORY &&
    match.gameCode === REGULAR_SEASON_GAME_CODE
  );
}

/**
 * match/list 응답(하루치, D리그 포함일 수 있음)에서 실제로 수집할 경기를 고른다.
 *   - gmkey 없음 → 그날 KBL 정규시즌 경기 전체 (ingestDay 용)
 *   - gmkey 있음 → 그 경기 하나 (없으면 빈 배열 — "못 찾음"의 표현)
 * KBL 호출도 DB 접근도 하지 않는 순수 함수라 배열만 손으로 만들어 테스트한다.
 */
export function selectMatches(
  matches: KblMatchRaw[],
  gmkey?: string,
): KblMatchRaw[] {
  const regular = matches.filter(isKblRegularSeason);
  if (!gmkey) {
    return regular;
  }
  return regular.filter((m) => m.gmkey === gmkey);
}

/** "YYYYMMDD" + "HHmm" (KST) → Date */
export function toGameKickoff(gameDate: string, gameStart: string): Date {
  const year = gameDate.slice(0, 4);
  const month = gameDate.slice(4, 6);
  const day = gameDate.slice(6, 8);
  const start = (gameStart || '0000').padStart(4, '0');
  return new Date(
    `${year}-${month}-${day}T${start.slice(0, 2)}:${start.slice(2, 4)}:00+09:00`,
  );
}

export function toTipOffLabel(gameStart: string): string | null {
  if (!gameStart) {
    return null;
  }
  const padded = gameStart.padStart(4, '0');
  return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
}

export interface GameUpsert {
  gmkey: string;
  gameDate: Date;
  tipOff: string | null;
  stadium: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isEnded: boolean;
  gameType: GameType;
  kblSeasonCategory: string;
  kblGameCode: string;
}

export function toGameUpsert(match: KblMatchRaw): GameUpsert {
  return {
    gmkey: match.gmkey,
    gameDate: toGameKickoff(match.gameDate, match.gameStart),
    tipOff: toTipOffLabel(match.gameStart),
    stadium: match.stadiumname ?? null,
    homeScore: match.scoreH ?? null,
    awayScore: match.scoreA ?? null,
    isEnded: match.isEnded === 1,
    gameType:
      match.seasonCategory === REGULAR_SEASON_CATEGORY ? 'REGULAR' : 'OTHER',
    kblSeasonCategory: match.seasonCategory,
    kblGameCode: match.gameCode,
  };
}

export interface PlayerUpsert {
  kblPlayerNo: string;
  koreanName: string;
  englishName: string | null;
  position: string | null;
}

export function toPlayerUpsert(entry: KblBoxScoreEntryRaw): PlayerUpsert {
  return {
    kblPlayerNo: entry.player.pcode,
    koreanName: entry.player.pname,
    englishName: entry.player.ename ?? null,
    position: entry.player.pos ?? null,
  };
}

export interface PlayerGameStatValues {
  isHome: boolean;
  isStarter: boolean;
  jerseyNumber: string | null;
  secondsPlayed: number;
  points: number;
  fgm: number;
  fga: number;
  fg2m: number;
  fg2a: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  offReb: number;
  defReb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  plusMinus: number | null;
  srcPer: number | null;
  srcPie: number | null;
  srcTsPct: number | null;
  srcEfgPct: number | null;
  srcUsgPct: number | null;
  srcAstPct: number | null;
  srcTovPct: number | null;
}

export function toPlayerGameStatValues(
  entry: KblBoxScoreEntryRaw,
): PlayerGameStatValues {
  const r = entry.records;
  return {
    isHome: entry.homeAway === '1',
    isStarter: entry.startFlag === 1,
    jerseyNumber: entry.player.backNum ?? null,
    secondsPlayed: playedSeconds(r),
    points: num(r.score),
    fgm: num(r.fgt),
    fga: num(r.fgtA),
    fg2m: num(r.fg),
    fg2a: num(r.fgA),
    fg3m: num(r.threep),
    fg3a: num(r.threepA),
    ftm: num(r.ft),
    fta: num(r.ftA),
    offReb: num(r.offr),
    defReb: num(r.defr),
    reb: num(r.rb),
    ast: num(r.ast),
    stl: num(r.stl),
    blk: num(r.bs),
    tov: num(r.to),
    pf: num(r.foul),
    plusMinus: opt(r.marginCn),
    srcPer: opt(r.per),
    srcPie: opt(r.pie),
    srcTsPct: opt(r.tsRt),
    srcEfgPct: opt(r.efgRt),
    srcUsgPct: opt(r.usgRt),
    srcAstPct: opt(r.astRt),
    srcTovPct: opt(r.tovRt),
  };
}

export interface TeamGameStatValues {
  isHome: boolean;
  secondsPlayed: number;
  points: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  offReb: number;
  defReb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
}

export function toTeamGameStatValues(
  entry: KblTeamRecordEntryRaw,
  isHome: boolean,
): TeamGameStatValues {
  const r = entry.records;
  return {
    isHome,
    secondsPlayed: playedSeconds(r),
    points: num(r.score),
    fgm: num(r.fgt),
    fga: num(r.fgtA),
    fg3m: num(r.threep),
    fg3a: num(r.threepA),
    ftm: num(r.ft),
    fta: num(r.ftA),
    offReb: num(r.offr),
    defReb: num(r.defr),
    reb: num(r.rb),
    ast: num(r.ast),
    stl: num(r.stl),
    blk: num(r.bs),
    tov: num(r.to),
    pf: num(r.foul),
  };
}
