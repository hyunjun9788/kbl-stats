/**
 * KBL API 원본 응답 형태. 실제 응답에서 확인한 필드만, 우리가 쓰는 것만 선언한다.
 * (spike/*.mjs 와 2026-02-10 S47G01N196 응답으로 검증)
 */

// ── meta: kbl-api.sports2i.com ──────────────────────────────────────────────

export interface KblRecentSeasonsResponse {
  code?: string;
  data: KblSeasonRaw[];
}

export interface KblSeasonRaw {
  seasonCode: number; // 일련번호. 2025-2026 = 47
  seasonName1: string; // "2025-2026"
  seasonName2?: string;
  remark?: string;
}

// ── stats: api-stats.kbl.or.kr ─────────────────────────────────────────────

export interface KblStatsListResponse<T> {
  resultCode?: string;
  message?: string;
  data: T[];
}

export interface KblTeamTraditionalRaw {
  seasonCode: number;
  teamCode: string; // "00" = 합계 행
  teamName1: string; // "부산 KCC"
  teamName4: string; // "KCC"
  rankNo: number;
  gameCount: number;
  win: number;
  lose: number;
}

// ── game: api.kbl.or.kr ────────────────────────────────────────────────────

export interface KblMatchRaw {
  gmkey: string; // "S47G01N196"
  glkey: string; // "S47G01"
  seasonCode: number;
  seasonName1: string; // "2025-2026"
  seasonCategory: string; // "R" = KBL 정규시즌, "D1" 등 = D리그
  seasonCategoryName: string;
  gameCode: string; // "01"
  gameDate: string; // "YYYYMMDD"
  gameStart: string; // "HHmm" (KST)
  gameNo: number;
  tcodeH: string;
  tcodeA: string;
  tnameH: string;
  tnameA: string;
  scoreH: number | null;
  scoreA: number | null;
  isEnded: number; // 0 | 1
  stadiumname: string | null;
}

/** 선수 박스스코어 / 팀 기록이 공유하는 counting + 어드밴스드 필드 */
export interface KblRecordRaw {
  score: number;
  fg: number; // 2점 성공
  fgA: number; // 2점 시도
  threep: number; // 3점 성공
  threepA: number; // 3점 시도
  fgt: number; // 전체 야투 성공
  fgtA: number; // 전체 야투 시도
  ft: number;
  ftA: number;
  offr: number;
  defr: number;
  rb: number;
  ast: number;
  stl: number;
  bs: number; // 블록
  to: number; // 턴오버
  foul: number;
  playMin: number;
  playSec: number;
  marginCn?: number; // +/-
  per?: number;
  pie?: number;
  tsRt?: number;
  efgRt?: number;
  usgRt?: number;
  astRt?: number;
  tovRt?: number;
}

export interface KblBoxScoreEntryRaw {
  player: {
    pcode: string; // 선수 식별자
    pname: string;
    ename?: string;
    tcode: string;
    tname: string;
    backNum: string | null;
    pos: string | null;
    img?: string;
  };
  records: KblRecordRaw;
  homeAway: string; // "1" 홈 | "2" 원정
  startFlag: number; // 0 | 1
}

export interface KblTeamRecordEntryRaw {
  tcode: string;
  records: KblRecordRaw;
}
