/** DI 토큰. KblApiModule 이 useFactory 로 KblApiConfig 를 제공한다. */
export const KBL_API_CONFIG = 'KBL_API_CONFIG';

export interface KblApiConfig {
  /** kbl-api.sports2i.com/api/v1 — 시즌/대회/코드/선수 프로필 메타데이터 */
  metaBaseUrl: string;
  /** api-stats.kbl.or.kr/api — 선수/팀 시즌 집계 기록 */
  statsBaseUrl: string;
  /** api.kbl.or.kr — 경기 일정/결과/박스스코어 */
  gameBaseUrl: string;
  /** 요청 사이 최소 간격(ms). 대상 서버 부담을 줄이기 위한 rate limit. */
  minRequestIntervalMs: number;
  userAgent: string;
}

export function loadKblApiConfig(): KblApiConfig {
  return {
    metaBaseUrl:
      process.env.KBL_META_BASE_URL ?? 'https://kbl-api.sports2i.com/api/v1',
    statsBaseUrl:
      process.env.KBL_STATS_BASE_URL ?? 'https://api-stats.kbl.or.kr/api',
    gameBaseUrl: process.env.KBL_GAME_BASE_URL ?? 'https://api.kbl.or.kr',
    minRequestIntervalMs: Number(
      process.env.KBL_MIN_REQUEST_INTERVAL_MS ?? '400',
    ),
    userAgent:
      process.env.KBL_USER_AGENT ??
      'kbl-stats/0.1 (personal portfolio project)',
  };
}
