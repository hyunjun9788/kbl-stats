import { Module } from '@nestjs/common';
import { PlayerSeasonAggregator } from './player-season-aggregator.service.js';
import { SeasonRankingAggregator } from './season-ranking-aggregator.service.js';
import { TeamSeasonAggregator } from './team-season-aggregator.service.js';

@Module({
  providers: [TeamSeasonAggregator, PlayerSeasonAggregator, SeasonRankingAggregator],
  exports: [TeamSeasonAggregator, PlayerSeasonAggregator, SeasonRankingAggregator],
})
export class AggregationModule {}
