import { Module } from '@nestjs/common';
import { TeamSeasonAggregator } from './team-season-aggregator.service.js';

@Module({
  providers: [TeamSeasonAggregator],
  exports: [TeamSeasonAggregator],
})
export class AggregationModule {}
