import { Injectable, Logger } from '@nestjs/common';
import type { Season } from '../generated/prisma/client.js';
import { KblGameClient } from '../kbl-api/clients/kbl-game.client.js';
import { KblMetaClient } from '../kbl-api/clients/kbl-meta.client.js';
import { KblStatsClient } from '../kbl-api/clients/kbl-stats.client.js';
import { KblApiError } from '../kbl-api/kbl-api.error.js';
import type { KblMatchRaw } from '../kbl-api/kbl-api.types.js';
import { IngestionRunContext } from '../run-context/ingestion-run.context.js';
import { IngestionRepository } from './ingestion.repository.js';
import {
  selectMatches,
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

/** 경기 한 건을 다 넣은 결과. */
export interface IngestOneMatchResult {
  gmkey: string;
  playerGameStats: number;
  teamGameStats: number;
}

/** ingestGame 한 번 호출의 결과. gmkey 를 지정하지 않으면 games 가 여러 건일 수 있다. */
export interface IngestGameResult {
  runId: number;
  games: IngestOneMatchResult[];
  playerGameStats: number; // games 전체 합
  teamGameStats: number; // games 전체 합
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
      await this.repo.finishRun(
        run.id,
        result.games.length,
        `gmkey=${result.games.map((g) => g.gmkey).join(',')}`,
      );
      this.logger.log(
        `[run ${run.id}] done — ${result.games.length} game(s), ${result.playerGameStats} player rows, ${result.teamGameStats} team rows`,
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
    // 1. 대상 경기 확정 — gmkey 없으면 그날 KBL 정규시즌 경기 전체.
    const selected = await this.resolveMatches(runId, params);

    // 2. 시즌 + 팀 10개 전체 — 하루에 경기가 여러 건이어도 한 번만 가져온다.
    //    (같은 날짜의 경기는 항상 같은 시즌이라고 가정하고 selected[0] 기준으로 조회)
    const { season, teamIdByCode } = await this.ensureSeasonAndTeams(
      runId,
      selected[0],
    );

    // 3. 경기마다 반복 — 한 경기 처리 로직은 ingestOneMatch 에 그대로 남아있다.
    const games: IngestOneMatchResult[] = [];
    for (const match of selected) {
      games.push(await this.ingestOneMatch(runId, match, season, teamIdByCode));
    }

    return {
      runId,
      games,
      playerGameStats: games.reduce((sum, g) => sum + g.playerGameStats, 0),
      teamGameStats: games.reduce((sum, g) => sum + g.teamGameStats, 0),
    };
  }

  /** 시즌 upsert + 해당 시즌 10개 팀 upsert. 하루 배치에서 경기 수와 무관하게 한 번만 호출된다. */
  private async ensureSeasonAndTeams(
    runId: number,
    sample: KblMatchRaw,
  ): Promise<{ season: Season; teamIdByCode: Map<string, number> }> {
    const season = await this.step(runId, 'season', async () => {
      const seasons = await this.meta.getRecentSeasons();
      const found = seasons.find((s) => s.seasonCode === sample.seasonCode);
      return this.repo.upsertSeason(
        toSeasonUpsert(
          found ?? {
            seasonCode: sample.seasonCode,
            seasonName1: sample.seasonName1,
          },
        ),
      );
    });

    const teamIdByCode = await this.step(runId, 'teams', async () => {
      const rows = await this.stats.getTeamTraditional(sample.seasonCode);
      const map = new Map<string, number>();
      for (const row of rows) {
        if (row.teamCode === '00') {
          continue; // 합계 행
        }
        const team = await this.repo.upsertTeam(toTeamUpsert(row));
        map.set(row.teamCode, team.id);
      }
      this.logger.log(`[run ${runId}] upserted ${map.size} team(s)`);
      return map;
    });

    return { season, teamIdByCode };
  }

  /** 경기 1건: Game → 박스스코어 fetch → Player → PlayerGameStat → TeamGameStat. */
  private async ingestOneMatch(
    runId: number,
    match: KblMatchRaw,
    season: Season,
    teamIdByCode: Map<string, number>,
  ): Promise<IngestOneMatchResult> {
    const gameRow = await this.step(runId, `game:${match.gmkey}`, () => {
      const homeTeamId = resolveTeam(teamIdByCode, match.tcodeH, 'home');
      const awayTeamId = resolveTeam(teamIdByCode, match.tcodeA, 'away');
      return this.repo.upsertGame({
        ...toGameUpsert(match),
        seasonId: season.id,
        homeTeamId,
        awayTeamId,
      });
    });

    const boxScore = await this.step(
      runId,
      `box-score:fetch:${match.gmkey}`,
      () => this.game.getBoxScore(match.gmkey),
    );

    const playerIdByCode = await this.step(
      runId,
      `players:${match.gmkey}`,
      async () => {
        const map = new Map<string, number>();
        for (const entry of boxScore) {
          const player = await this.repo.upsertPlayer(toPlayerUpsert(entry));
          map.set(entry.player.pcode, player.id);
        }
        this.logger.log(`[run ${runId}] upserted ${map.size} player(s)`);
        return map;
      },
    );

    const playerGameStats = await this.step(
      runId,
      `player-game-stats:${match.gmkey}`,
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

    const teamGameStats = await this.step(
      runId,
      `team-game-stats:${match.gmkey}`,
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

    return { gmkey: match.gmkey, playerGameStats, teamGameStats };
  }

  /**
   * gmkey 없이는 KBL API에 날짜가 없으므로 항상 match/list 를 먼저 불러야 한다.
   * 선택 로직 자체(selectMatches)는 순수 함수로 빼서 단위테스트하고, 여기서는
   * "호출하고 → 못 찾으면 에러 메시지를 채워서 던진다" 만 담당한다.
   */
  private async resolveMatches(
    runId: number,
    params: IngestGameParams,
  ): Promise<KblMatchRaw[]> {
    return this.step(runId, 'resolve-matches', async () => {
      const matches = await this.game.getMatchList(params.date, params.date);
      const selected = selectMatches(matches, params.gmkey);
      if (selected.length === 0) {
        throw new Error(
          params.gmkey
            ? `gmkey ${params.gmkey} not found among regular-season games on ${params.date}`
            : `no KBL regular-season game on ${params.date} (${matches.length} row(s) returned)`,
        );
      }
      for (const m of selected) {
        this.logger.log(
          `[run ${runId}] match ${m.gmkey}: ${m.tnameH} ${m.scoreH ?? '-'}:${m.scoreA ?? '-'} ${m.tnameA}`,
        );
      }
      return selected;
    });
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
