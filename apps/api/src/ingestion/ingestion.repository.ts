import { Injectable } from '@nestjs/common';
import type {
  Game,
  IngestionRun,
  Player,
  Season,
  Team,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  GameUpsert,
  PlayerGameStatValues,
  PlayerUpsert,
  SeasonUpsert,
  TeamGameStatValues,
  TeamUpsert,
} from './kbl-to-prisma.mappers.js';

/**
 * Prisma upsert 모음. 전부 natural key(kblSeasonCode, gmkey, [gameId,playerId] ...) 기준이라
 * 몇 번을 다시 실행해도 중복이 생기지 않는다 → 단일 경기 검증을 반복할 수 있다.
 */
@Injectable()
export class IngestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  startRun(trigger: string): Promise<IngestionRun> {
    return this.prisma.ingestionRun.create({
      data: { trigger, status: 'RUNNING' },
    });
  }

  finishRun(
    id: number,
    gamesIngested: number,
    notes?: string,
  ): Promise<IngestionRun> {
    return this.prisma.ingestionRun.update({
      where: { id },
      data: {
        status: 'SUCCESS',
        finishedAt: new Date(),
        gamesIngested,
        notes: notes ?? null,
      },
    });
  }

  failRun(id: number, error: string): Promise<IngestionRun> {
    return this.prisma.ingestionRun.update({
      where: { id },
      data: { status: 'FAILED', finishedAt: new Date(), error: error.slice(0, 1000) },
    });
  }

  upsertSeason(input: SeasonUpsert): Promise<Season> {
    return this.prisma.season.upsert({
      where: { kblSeasonCode: input.kblSeasonCode },
      create: input,
      update: { name: input.name, startYear: input.startYear },
    });
  }

  upsertTeam(input: TeamUpsert): Promise<Team> {
    return this.prisma.team.upsert({
      where: { kblTeamCode: input.kblTeamCode },
      create: input,
      update: { name: input.name, shortName: input.shortName },
    });
  }

  upsertPlayer(input: PlayerUpsert): Promise<Player> {
    return this.prisma.player.upsert({
      where: { kblPlayerNo: input.kblPlayerNo },
      create: input,
      update: {
        koreanName: input.koreanName,
        englishName: input.englishName,
        position: input.position,
      },
    });
  }

  upsertGame(
    input: GameUpsert & {
      seasonId: number;
      homeTeamId: number;
      awayTeamId: number;
    },
  ): Promise<Game> {
    const { seasonId, homeTeamId, awayTeamId, ...fields } = input;
    return this.prisma.game.upsert({
      where: { gmkey: input.gmkey },
      create: {
        ...fields,
        season: { connect: { id: seasonId } },
        homeTeam: { connect: { id: homeTeamId } },
        awayTeam: { connect: { id: awayTeamId } },
      },
      update: {
        gameDate: fields.gameDate,
        tipOff: fields.tipOff,
        stadium: fields.stadium,
        homeScore: fields.homeScore,
        awayScore: fields.awayScore,
        isEnded: fields.isEnded,
        gameType: fields.gameType,
        kblSeasonCategory: fields.kblSeasonCategory,
        kblGameCode: fields.kblGameCode,
      },
    });
  }

  upsertPlayerGameStat(
    gameId: number,
    playerId: number,
    teamId: number,
    values: PlayerGameStatValues,
  ) {
    return this.prisma.playerGameStat.upsert({
      where: { gameId_playerId: { gameId, playerId } },
      create: { gameId, playerId, teamId, ...values },
      update: { teamId, ...values },
    });
  }

  upsertTeamGameStat(
    gameId: number,
    teamId: number,
    values: TeamGameStatValues,
  ) {
    return this.prisma.teamGameStat.upsert({
      where: { gameId_teamId: { gameId, teamId } },
      create: { gameId, teamId, ...values },
      update: values,
    });
  }
}
