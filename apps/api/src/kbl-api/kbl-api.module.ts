import { Module } from '@nestjs/common';
import { KblGameClient } from './clients/kbl-game.client.js';
import { KblMetaClient } from './clients/kbl-meta.client.js';
import { KblStatsClient } from './clients/kbl-stats.client.js';
import { KBL_API_CONFIG, loadKblApiConfig } from './kbl-api.config.js';
import { KblRateLimiter } from './kbl-rate-limiter.js';
import { RawResponseRecorder } from './raw-response.recorder.js';

@Module({
  providers: [
    { provide: KBL_API_CONFIG, useFactory: loadKblApiConfig },
    KblRateLimiter,
    RawResponseRecorder,
    KblMetaClient,
    KblStatsClient,
    KblGameClient,
  ],
  exports: [KblMetaClient, KblStatsClient, KblGameClient],
})
export class KblApiModule {}
