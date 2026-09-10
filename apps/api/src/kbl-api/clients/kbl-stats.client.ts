import { Inject, Injectable } from '@nestjs/common';
import { KBL_API_CONFIG, type KblApiConfig } from '../kbl-api.config.js';
import { KblHttpClient } from '../kbl-http-client.js';
import { KblRateLimiter } from '../kbl-rate-limiter.js';
import { RawResponseRecorder } from '../raw-response.recorder.js';
import type {
  KblStatsListResponse,
  KblTeamTraditionalRaw,
} from '../kbl-api.types.js';

/**
 * api-stats.kbl.or.kr — 선수/팀 시즌 집계 기록.
 * Referer 가 없으면 401 을 반환한다 (spike 참고).
 */
@Injectable()
export class KblStatsClient extends KblHttpClient {
  constructor(
    rateLimiter: KblRateLimiter,
    recorder: RawResponseRecorder,
    @Inject(KBL_API_CONFIG) config: KblApiConfig,
  ) {
    super(
      { rateLimiter, recorder, userAgent: config.userAgent },
      'stats',
      config.statsBaseUrl,
      {
        Origin: 'https://www.kbl.or.kr',
        Referer: 'https://www.kbl.or.kr/',
      },
    );
  }

  /** 시즌 팀 목록 + 팀명. teamCode "00"(합계)이 섞여 있으므로 호출부에서 제외할 것. */
  async getTeamTraditional(
    seasonCode: number,
    gameCode = '01',
  ): Promise<KblTeamTraditionalRaw[]> {
    const body = await this.get<KblStatsListResponse<KblTeamTraditionalRaw>>(
      '/records/team/general/traditional',
      { seasonCode, gameCode, sortDataSc: 'score', sortOrderSc: 'DESC' },
    );
    return body.data ?? [];
  }
}
