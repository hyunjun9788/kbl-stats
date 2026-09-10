import { Inject, Injectable } from '@nestjs/common';
import { KBL_API_CONFIG, type KblApiConfig } from '../kbl-api.config.js';
import { KblHttpClient } from '../kbl-http-client.js';
import { KblRateLimiter } from '../kbl-rate-limiter.js';
import { RawResponseRecorder } from '../raw-response.recorder.js';
import type {
  KblBoxScoreEntryRaw,
  KblMatchRaw,
  KblTeamRecordEntryRaw,
} from '../kbl-api.types.js';

/**
 * api.kbl.or.kr — 경기 일정/결과/박스스코어.
 * Referer 만으로는 부족하고 Channel / TeamCode / lang / X-Requested-With 가 없으면
 * 500 "필수 헤더 정보가 누락되었습니다" 를 반환한다 (spike 6장).
 */
@Injectable()
export class KblGameClient extends KblHttpClient {
  constructor(
    rateLimiter: KblRateLimiter,
    recorder: RawResponseRecorder,
    @Inject(KBL_API_CONFIG) config: KblApiConfig,
  ) {
    super(
      { rateLimiter, recorder, userAgent: config.userAgent },
      'game',
      config.gameBaseUrl,
      {
        Origin: 'https://www.kbl.or.kr',
        Referer: 'https://www.kbl.or.kr/',
        'X-Requested-With': 'XMLHttpRequest',
        Channel: 'WEB',
        TeamCode: '00',
        lang: 'ko',
      },
    );
  }

  /** 기간별 경기 목록 (YYYYMMDD). KBL 1군과 D리그가 섞여 나온다. */
  async getMatchList(fromDate: string, toDate: string): Promise<KblMatchRaw[]> {
    return this.get<KblMatchRaw[]>('/match/list', { fromDate, toDate });
  }

  /** 경기별 선수 박스스코어 (양 팀). */
  async getBoxScore(gmkey: string): Promise<KblBoxScoreEntryRaw[]> {
    return this.get<KblBoxScoreEntryRaw[]>(`/match/${gmkey}/player-stat`);
  }

  /** 경기별 팀 기록 (2행). */
  async getTeamRecord(gmkey: string): Promise<KblTeamRecordEntryRaw[]> {
    return this.get<KblTeamRecordEntryRaw[]>(`/match/${gmkey}/team-record`);
  }
}
