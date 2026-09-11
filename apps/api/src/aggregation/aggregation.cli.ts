import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { TeamSeasonAggregator } from './team-season-aggregator.service.js';

function parseSeasonCode(argv: string[]): number {
  const hit = argv.find((a) => a.startsWith('--season='));
  const value = hit ? Number(hit.slice('--season='.length)) : NaN;
  if (!Number.isInteger(value)) {
    throw new Error('usage: aggregate:team-season -- --season=47');
  }
  return value;
}

async function main(): Promise<void> {
  const seasonCode = parseSeasonCode(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const logger = new Logger('aggregate:team-season');
  try {
    const result = await app.get(TeamSeasonAggregator).aggregateSeason(seasonCode);
    logger.log(`OK ${JSON.stringify(result)}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  new Logger('aggregate:team-season').error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exitCode = 1;
});
