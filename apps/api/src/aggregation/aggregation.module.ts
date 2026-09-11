import { Module } from '@nestjs/common';
import { PlayerSeasonAggregator } from './player-season-aggregator.service.js';
import { TeamSeasonAggregator } from './team-season-aggregator.service.js';

@Module({
  providers: [TeamSeasonAggregator, PlayerSeasonAggregator],
  exports: [TeamSeasonAggregator, PlayerSeasonAggregator],
})
export class AggregationModule {}
