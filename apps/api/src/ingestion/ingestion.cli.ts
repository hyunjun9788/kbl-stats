import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { IngestionService } from './ingestion.service.js';

interface CliArgs {
  date: string;
  gmkey?: string;
}

function parseArgs(argv: string[]): CliArgs {
  const flag = (name: string): string | undefined => {
    const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
    if (hit === undefined) {
      return undefined;
    }
    const eq = hit.indexOf('=');
    return eq === -1 ? '' : hit.slice(eq + 1);
  };

  const date = flag('date');
  if (!date || !/^\d{8}$/.test(date)) {
    throw new Error(
      'required: --date=YYYYMMDD   optional: --gmkey=S47G01N196',
    );
  }
  return { date, gmkey: flag('gmkey') || undefined };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const logger = new Logger('ingest:game');
  try {
    const result = await app.get(IngestionService).ingestGame(args);
    logger.log(`OK ${JSON.stringify(result)}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  new Logger('ingest:game').error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exitCode = 1;
});
