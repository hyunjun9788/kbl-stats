import { Inject, Injectable } from '@nestjs/common';
import { KBL_API_CONFIG, type KblApiConfig } from '../kbl-api.config.js';
import { KblHttpClient } from '../kbl-http-client.js';
import { KblRateLimiter } from '../kbl-rate-limiter.js';
import { RawResponseRecorder } from '../raw-response.recorder.js';
import type {
  KblRecentSeasonsResponse,
  KblSeasonRaw,
} from '../kbl-api.types.js';

/** kbl-api.sports2i.com — 시즌/대회/코드/선수 프로필. Origin + Referer 헤더면 충분. */
@Injectable()
export class KblMetaClient extends KblHttpClient {
  constructor(
    rateLimiter: KblRateLimiter,
    recorder: RawResponseRecorder,
    @Inject(KBL_API_CONFIG) config: KblApiConfig,
  ) {
    super({ rateLimiter, recorder, userAgent: config.userAgent }, 'meta', config.metaBaseUrl, {
      Origin: 'https://www.kbl.or.kr',
      Referer: 'https://www.kbl.or.kr/',
    });
  }

  async getRecentSeasons(): Promise<KblSeasonRaw[]> {
    const body = await this.get<KblRecentSeasonsResponse>(
      '/Common/recent-seasons',
      { seriesCd: 1 },
    );
    return body.data ?? [];
  }
}
