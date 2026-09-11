import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { effectiveFgPct, trueShootingPct, turnoverPct } from './advanced-stats.js';

export interface AggregatePlayerSeasonResult {
  seasonCode: number;
  players: number;
}

/**
 * PlayerGameStat(경기별 선수 기록)을 선수 × 시즌으로 SUM 해 PlayerSeasonStat에 upsert 한다.
 *
 * 이번 단계(A그룹)에서 채우는 것: 누적 counting 전부 + TS%/eFG%/TOV% — 선수 자신의
 * 시즌 합계만으로 계산되는 지표. USG%/AST%(팀 시즌 합계 필요)와 PER(리그 전체 필요)은
 * 다음 단계에서 채운다 — 지금은 null로 남는다.
 */
@Injectable()
export class PlayerSeasonAggregator {
  private readonly logger = new Logger(PlayerSeasonAggregator.name);

  constructor(private readonly prisma: PrismaService) {}

  async aggregateSeason(
    seasonCode: number,
  ): Promise<AggregatePlayerSeasonResult> {
    const season = await this.prisma.season.findUniqueOrThrow({
      where: { kblSeasonCode: seasonCode },
    });

    const sums = await this.prisma.playerGameStat.groupBy({
      by: ['playerId'],
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

    // groupBy는 조건부 카운트를 지원하지 않으므로, 선발 출전 횟수는 별도 쿼리로.
    const starterRows = await this.prisma.playerGameStat.groupBy({
      by: ['playerId'],
      where: { game: { seasonId: season.id }, isStarter: true },
      _count: { _all: true },
    });
    const startersByPlayer = new Map(
      starterRows.map((row) => [row.playerId, row._count._all]),
    );

    // "시즌 마지막 소속팀" — 경기를 날짜순으로 훑으며 매번 덮어써서 가장 최근 값만 남긴다.
    const teamHistory = await this.prisma.playerGameStat.findMany({
      where: { game: { seasonId: season.id } },
      select: { playerId: true, teamId: true, game: { select: { gameDate: true } } },
      orderBy: { game: { gameDate: 'asc' } },
    });
    const latestTeamByPlayer = new Map<number, number>();
    for (const row of teamHistory) {
      latestTeamByPlayer.set(row.playerId, row.teamId);
    }

    for (const row of sums) {
      const s = row._sum;
      const teamId = latestTeamByPlayer.get(row.playerId);
      if (teamId === undefined) {
        this.logger.warn(`player ${row.playerId}: no team found, skipping`);
        continue;
      }

      const points = s.points ?? 0;
      const fgm = s.fgm ?? 0;
      const fga = s.fga ?? 0;
      const fg3m = s.fg3m ?? 0;
      const fta = s.fta ?? 0;
      const tov = s.tov ?? 0;

      const data = {
        teamId,
        games: row._count._all,
        gamesStarted: startersByPlayer.get(row.playerId) ?? 0,
        secondsPlayed: s.secondsPlayed ?? 0,
        points,
        fgm,
        fga,
        fg3m,
        fg3a: s.fg3a ?? 0,
        ftm: s.ftm ?? 0,
        fta,
        offReb: s.offReb ?? 0,
        defReb: s.defReb ?? 0,
        reb: s.reb ?? 0,
        ast: s.ast ?? 0,
        stl: s.stl ?? 0,
        blk: s.blk ?? 0,
        tov,
        pf: s.pf ?? 0,
        tsPct: trueShootingPct(points, fga, fta),
        efgPct: effectiveFgPct(fgm, fg3m, fga),
        tovPct: turnoverPct(tov, fga, fta),
      };

      await this.prisma.playerSeasonStat.upsert({
        where: { playerId_seasonId: { playerId: row.playerId, seasonId: season.id } },
        create: { playerId: row.playerId, seasonId: season.id, ...data },
        update: data,
      });
    }

    this.logger.log(
      `season ${seasonCode}: aggregated PlayerSeasonStat for ${sums.length} player(s)`,
    );
    return { seasonCode, players: sums.length };
  }
}
