import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AggregateTeamSeasonResult {
  seasonCode: number;
  teams: number;
}

/**
 * TeamGameStat(경기별 팀 기록)을 팀 × 시즌으로 SUM 해 TeamSeasonStat에 upsert 한다.
 *
 * 순수 SQL GROUP BY 문제라 애플리케이션에서 루프를 돌며 더할 필요가 없다 —
 * Prisma의 groupBy가 그대로 "GROUP BY teamId, SUM(...)"로 내려간다.
 */
@Injectable()
export class TeamSeasonAggregator {
  private readonly logger = new Logger(TeamSeasonAggregator.name);

  constructor(private readonly prisma: PrismaService) {}

  async aggregateSeason(seasonCode: number): Promise<AggregateTeamSeasonResult> {
    const season = await this.prisma.season.findUniqueOrThrow({
      where: { kblSeasonCode: seasonCode },
    });

    const sums = await this.prisma.teamGameStat.groupBy({
      by: ['teamId'],
      where: { game: { seasonId: season.id } },
      _count: { _all: true },
      _sum: {
        secondsPlayed: true,
        points: true,
        fgm: true,
        fga: true,
        fg3m: true,
        fg3a: true,
        ftm: true,
        fta: true,
        offReb: true,
        defReb: true,
        reb: true,
        ast: true,
        stl: true,
        blk: true,
        tov: true,
        pf: true,
      },
    });

    for (const row of sums) {
      await this.prisma.teamSeasonStat.upsert({
        where: { teamId_seasonId: { teamId: row.teamId, seasonId: season.id } },
        create: {
          teamId: row.teamId,
          seasonId: season.id,
          games: row._count._all,
          secondsPlayed: row._sum.secondsPlayed ?? 0,
          points: row._sum.points ?? 0,
          fgm: row._sum.fgm ?? 0,
          fga: row._sum.fga ?? 0,
          fg3m: row._sum.fg3m ?? 0,
          fg3a: row._sum.fg3a ?? 0,
          ftm: row._sum.ftm ?? 0,
          fta: row._sum.fta ?? 0,
          offReb: row._sum.offReb ?? 0,
          defReb: row._sum.defReb ?? 0,
          reb: row._sum.reb ?? 0,
          ast: row._sum.ast ?? 0,
          stl: row._sum.stl ?? 0,
          blk: row._sum.blk ?? 0,
          tov: row._sum.tov ?? 0,
          pf: row._sum.pf ?? 0,
        },
        update: {
          games: row._count._all,
          secondsPlayed: row._sum.secondsPlayed ?? 0,
          points: row._sum.points ?? 0,
          fgm: row._sum.fgm ?? 0,
          fga: row._sum.fga ?? 0,
          fg3m: row._sum.fg3m ?? 0,
          fg3a: row._sum.fg3a ?? 0,
          ftm: row._sum.ftm ?? 0,
          fta: row._sum.fta ?? 0,
          offReb: row._sum.offReb ?? 0,
          defReb: row._sum.defReb ?? 0,
          reb: row._sum.reb ?? 0,
          ast: row._sum.ast ?? 0,
          stl: row._sum.stl ?? 0,
          blk: row._sum.blk ?? 0,
          tov: row._sum.tov ?? 0,
          pf: row._sum.pf ?? 0,
        },
      });
    }

    this.logger.log(
      `season ${seasonCode}: aggregated TeamSeasonStat for ${sums.length} team(s)`,
    );
    return { seasonCode, teams: sums.length };
  }
}
