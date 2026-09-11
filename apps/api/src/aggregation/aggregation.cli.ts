import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PlayerSeasonAggregator } from './player-season-aggregator.service.js';
import { TeamSeasonAggregator } from './team-season-aggregator.service.js';

function parseSeasonCode(argv: string[]): number {
  const hit = argv.find((a) => a.startsWith('--season='));
  const value = hit ? Number(hit.slice('--season='.length)) : NaN;
  if (!Number.isInteger(value)) {
    throw new Error('usage: aggregate:season -- --season=47');
  }
  return value;
}

async function main(): Promise<void> {
  const seasonCode = parseSeasonCode(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const logger = new Logger('aggregate:season');
  try {
    // 팀을 먼저 집계한다 — 이후 단계(USG%/AST%)가 TeamSeasonStat을 필요로 한다.
    const teams = await app.get(TeamSeasonAggregator).aggregateSeason(seasonCode);
    const players = await app.get(PlayerSeasonAggregator).aggregateSeason(seasonCode);
    logger.log(`OK ${JSON.stringify({ teams, players })}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  new Logger('aggregate:season').error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exitCode = 1;
});
