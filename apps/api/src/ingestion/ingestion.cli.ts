import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { IngestionService } from './ingestion.service.js';

type CliArgs =
  | { mode: 'day'; date: string; gmkey?: string }
  | { mode: 'range'; from: string; to: string };

const USAGE =
  'usage:\n' +
  '  ingest one day / one game : --date=YYYYMMDD [--gmkey=S47G01N196]\n' +
  '  backfill a date range     : --from=YYYYMMDD --to=YYYYMMDD';

function flagOf(argv: string[], name: string): string | undefined {
  const hit = argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (hit === undefined) {
    return undefined;
  }
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

function parseArgs(argv: string[]): CliArgs {
  const date = flagOf(argv, 'date');
  const from = flagOf(argv, 'from');
  const to = flagOf(argv, 'to');

  if (date) {
    if (!/^\d{8}$/.test(date)) {
      throw new Error(`invalid --date=${date}\n${USAGE}`);
    }
    return { mode: 'day', date, gmkey: flagOf(argv, 'gmkey') || undefined };
  }

  if (from || to) {
    if (!from || !to || !/^\d{8}$/.test(from) || !/^\d{8}$/.test(to)) {
      throw new Error(`--from and --to must both be YYYYMMDD\n${USAGE}`);
    }
    return { mode: 'range', from, to };
  }

  throw new Error(USAGE);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  const logger = new Logger('ingest');
  try {
    const service = app.get(IngestionService);
    const result =
      args.mode === 'day'
        ? await service.ingestGame(args)
        : await service.ingestDateRange(args);
    logger.log(`OK ${JSON.stringify(result)}`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  new Logger('ingest').error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exitCode = 1;
});
