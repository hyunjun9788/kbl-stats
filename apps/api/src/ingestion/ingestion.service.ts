import { Injectable, Logger } from '@nestjs/common';
import { KblGameClient } from '../kbl-api/clients/kbl-game.client.js';
import { KblMetaClient } from '../kbl-api/clients/kbl-meta.client.js';
import { KblStatsClient } from '../kbl-api/clients/kbl-stats.client.js';
import { KblApiError } from '../kbl-api/kbl-api.error.js';
import { IngestionRunContext } from '../run-context/ingestion-run.context.js';
import { IngestionRepository } from './ingestion.repository.js';
import {
  isKblRegularSeason,
  toGameUpsert,
  toPlayerGameStatValues,
  toPlayerUpsert,
  toSeasonUpsert,
  toTeamGameStatValues,
  toTeamUpsert,
} from './kbl-to-prisma.mappers.js';

export interface IngestGameParams {
  /** YYYYMMDD (KST) */
  date: string;
  /** 생략 시 해당 날짜의 첫 KBL 정규시즌 경기 */
  gmkey?: string;
}

export interface IngestGameResult {
  runId: number;
  gmkey: string;
  playerGameStats: number;
  teamGameStats: number;
}

/** 특정 단계에서 실패했음을 나타낸다 (메시지에 단계명 + API 상세가 이미 담겨 있다). */
class IngestionStepError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'IngestionStepError';
  }
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly meta: KblMetaClient,
    private readonly stats: KblStatsClient,
    private readonly game: KblGameClient,
    private readonly repo: IngestionRepository,
    private readonly runContext: IngestionRunContext,
  ) {}

  async ingestGame(params: IngestGameParams): Promise<IngestGameResult> {
    const run = await this.repo.startRun('manual');
    this.logger.log(
      `[run ${run.id}] ingestGame date=${params.date} gmkey=${params.gmkey ?? '(auto)'}`,
    );

    try {
      const result = await this.runContext.run(run.id, () =>
        this.runSteps(run.id, params),
      );
      await this.repo.finishRun(run.id, 1, `gmkey=${result.gmkey}`);
      this.logger.log(
        `[run ${run.id}] done — ${result.playerGameStats} player rows, ${result.teamGameStats} team rows`,
      );
      return result;
    } catch (error) {
      const detail =
        error instanceof IngestionStepError
          ? error.message
          : describeError('ingestGame', error);
      await this.repo.failRun(run.id, detail).catch(() => undefined);
      this.logger.error(`[run ${run.id}] FAILED — ${detail}`);
      throw error;
    }
  }

  private async runSteps(
    runId: number,
    params: IngestGameParams,
  ): Promise<IngestGameResult> {
    // 1. 대상 경기 확정 — gmkey 만으로는 KBL API 에 날짜가 없어 match/list 조회에 날짜가 필요하다.
    const match = await this.step(runId, 'resolve-match', async () => {
      const matches = await this.game.getMatchList(params.date, params.date);
      const regular = matches.filter(isKblRegularSeason);
      const target = params.gmkey
        ? regular.find((m) => m.gmkey === params.gmkey)
        : regular[0];
      if (!target) {
        throw new Error(
          params.gmkey
            ? `gmkey ${params.gmkey} not found among ${regular.length} regular-season game(s) on ${params.date}`
            : `no KBL regular-season game on ${params.date} (${matches.length} row(s) returned)`,
        );
      }
      this.logger.log(
        `[run ${runId}] target ${target.gmkey}: ${target.tnameH} ${target.scoreH ?? '-'}:${target.scoreA ?? '-'} ${target.tnameA}`,
      );
      return target;
    });

    // 2. 시즌
    const season = await this.step(runId, 'season', async () => {
      const seasons = await this.meta.getRecentSeasons();
      const found = seasons.find((s) => s.seasonCode === match.seasonCode);
      return this.repo.upsertSeason(
        toSeasonUpsert(
          found ?? {
            seasonCode: match.seasonCode,
            seasonName1: match.seasonName1,
          },
        ),
      );
    });

    // 3. 해당 시즌 10개 팀 전체 (teamCode "00" 합계 제외)
    const teamIdByCode = await this.step(runId, 'teams', async () => {
      const rows = await this.stats.getTeamTraditional(match.seasonCode);
      const map = new Map<string, number>();
      for (const row of rows) {
        if (row.teamCode === '00') {
          continue;
        }
        const team = await this.repo.upsertTeam(toTeamUpsert(row));
        map.set(row.teamCode, team.id);
      }
      this.logger.log(`[run ${runId}] upserted ${map.size} team(s)`);
      return map;
    });

    // 4. 경기
    const gameRow = await this.step(runId, 'game', () => {
      const homeTeamId = resolveTeam(teamIdByCode, match.tcodeH, 'home');
      const awayTeamId = resolveTeam(teamIdByCode, match.tcodeA, 'away');
      return this.repo.upsertGame({
        ...toGameUpsert(match),
        seasonId: season.id,
        homeTeamId,
        awayTeamId,
      });
    });

    // 5. 박스스코어 fetch (6·7단계에서 재사용)
    const boxScore = await this.step(runId, 'box-score:fetch', () =>
      this.game.getBoxScore(match.gmkey),
    );

    // 6. 박스스코어에서 확보되는 선수 정보로 Player upsert
    const playerIdByCode = await this.step(runId, 'players', async () => {
      const map = new Map<string, number>();
      for (const entry of boxScore) {
        const player = await this.repo.upsertPlayer(toPlayerUpsert(entry));
        map.set(entry.player.pcode, player.id);
      }
      this.logger.log(`[run ${runId}] upserted ${map.size} player(s)`);
      return map;
    });

    // 7. PlayerGameStat
    const playerGameStats = await this.step(
      runId,
      'player-game-stats',
      async () => {
        let count = 0;
        for (const entry of boxScore) {
          const playerId = playerIdByCode.get(entry.player.pcode);
          const teamId = teamIdByCode.get(entry.player.tcode);
          if (playerId === undefined || teamId === undefined) {
            throw new Error(
              `unresolved ref for ${entry.player.pname}: playerId=${playerId} teamId=${teamId} (tcode=${entry.player.tcode})`,
            );
          }
          await this.repo.upsertPlayerGameStat(
            gameRow.id,
            playerId,
            teamId,
            toPlayerGameStatValues(entry),
          );
          count += 1;
        }
        return count;
      },
    );

    // 8. TeamGameStat
    const teamGameStats = await this.step(
      runId,
      'team-game-stats',
      async () => {
        const teamRecords = await this.game.getTeamRecord(match.gmkey);
        let count = 0;
        for (const entry of teamRecords) {
          const teamId = teamIdByCode.get(entry.tcode);
          if (teamId === undefined) {
            throw new Error(
              `unresolved team ${entry.tcode} in team-record for ${match.gmkey}`,
            );
          }
          await this.repo.upsertTeamGameStat(
            gameRow.id,
            teamId,
            toTeamGameStatValues(entry, entry.tcode === match.tcodeH),
          );
          count += 1;
        }
        return count;
      },
    );

    return { runId, gmkey: match.gmkey, playerGameStats, teamGameStats };
  }

  private async step<T>(
    runId: number,
    name: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    this.logger.log(`[run ${runId}] > ${name}`);
    try {
      return await fn();
    } catch (error) {
      const detail = describeError(name, error);
      this.logger.error(`[run ${runId}] x ${detail}`);
      throw new IngestionStepError(detail, { cause: error });
    }
  }
}

function resolveTeam(
  map: Map<string, number>,
  code: string,
  side: string,
): number {
  const id = map.get(code);
  if (id === undefined) {
    throw new Error(`${side} team code ${code} not in season team list`);
  }
  return id;
}

function describeError(step: string, error: unknown): string {
  if (error instanceof KblApiError) {
    return `${step}: [${error.source}] ${error.endpoint} HTTP ${error.status} params=${JSON.stringify(error.params)}`;
  }
  if (error instanceof Error) {
    return `${step}: ${error.message}`;
  }
  return `${step}: ${String(error)}`;
}
