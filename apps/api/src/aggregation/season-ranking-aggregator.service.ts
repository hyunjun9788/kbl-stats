import { Injectable, Logger } from '@nestjs/common';
import type { PlayerSeasonStat, RankingMetric } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { perGame, ratioPct } from './advanced-stats.js';
import { rankAndPercentile } from './percentile.js';

export interface RankSeasonResult {
  seasonCode: number;
  population: number;
  metrics: number;
}

interface MetricSpec {
  metric: RankingMetric;
  higherIsBetter: boolean;
  value: (p: PlayerSeasonStat) => number | null;
}

/**
 * 아직 PER/PIE는 여기 없다 — 둘 다 리그 전체 2차 계산(C/D그룹)이 끝나야 값이 생긴다.
 * 값이 null인 선수는 rankAndPercentile 호출 전에 걸러진다.
 */
const METRIC_SPECS: MetricSpec[] = [
  { metric: 'PTS', higherIsBetter: true, value: (p) => perGame(p.points, p.games) },
  { metric: 'REB', higherIsBetter: true, value: (p) => perGame(p.reb, p.games) },
  { metric: 'AST', higherIsBetter: true, value: (p) => perGame(p.ast, p.games) },
  { metric: 'STL', higherIsBetter: true, value: (p) => perGame(p.stl, p.games) },
  { metric: 'BLK', higherIsBetter: true, value: (p) => perGame(p.blk, p.games) },
  { metric: 'FG_PCT', higherIsBetter: true, value: (p) => ratioPct(p.fgm, p.fga) },
  { metric: 'FG3_PCT', higherIsBetter: true, value: (p) => ratioPct(p.fg3m, p.fg3a) },
  { metric: 'FT_PCT', higherIsBetter: true, value: (p) => ratioPct(p.ftm, p.fta) },
  { metric: 'TS_PCT', higherIsBetter: true, value: (p) => p.tsPct },
  { metric: 'EFG_PCT', higherIsBetter: true, value: (p) => p.efgPct },
  { metric: 'USG_PCT', higherIsBetter: true, value: (p) => p.usgPct },
  { metric: 'AST_PCT', higherIsBetter: true, value: (p) => p.astPct },
  { metric: 'TOV_PCT', higherIsBetter: false, value: (p) => p.tovPct }, // 낮을수록 좋음
];

/**
 * 자격 통과 선수(qualified=true)만 모아 지표별 순위/percentile을 계산해
 * SeasonMetricRanking에 넣는다. PlayerSeasonAggregator가 이 서비스보다 먼저
 * 실행돼 qualified 플래그가 채워져 있어야 한다.
 *
 * upsert가 아니라 delete-then-insert다 — 모집단(qualified 여부)이 재계산마다
 * 바뀔 수 있어서, 이번 자격을 잃은 선수의 이전 순위가 남아있으면 안 된다.
 */
@Injectable()
export class SeasonRankingAggregator {
  private readonly logger = new Logger(SeasonRankingAggregator.name);

  constructor(private readonly prisma: PrismaService) {}

  async rankSeason(seasonCode: number): Promise<RankSeasonResult> {
    const season = await this.prisma.season.findUniqueOrThrow({
      where: { kblSeasonCode: seasonCode },
    });

    const qualified = await this.prisma.playerSeasonStat.findMany({
      where: { seasonId: season.id, qualified: true },
    });

    await this.prisma.seasonMetricRanking.deleteMany({
      where: { seasonId: season.id },
    });

    const rows = METRIC_SPECS.flatMap((spec) => {
      const entries = qualified
        .map((p) => ({ id: p.id, value: spec.value(p) }))
        .filter((entry): entry is { id: number; value: number } => entry.value !== null);

      return rankAndPercentile(entries, spec.higherIsBetter).map((r) => ({
        playerSeasonStatId: r.id,
        seasonId: season.id,
        metric: spec.metric,
        value: r.value,
        percentileRaw: r.percentileRaw,
        percentileBucket: r.percentileBucket,
        rank: r.rank,
        population: entries.length,
      }));
    });

    if (rows.length > 0) {
      await this.prisma.seasonMetricRanking.createMany({ data: rows });
    }

    this.logger.log(
      `season ${seasonCode}: ranked ${qualified.length} qualified player(s) across ${METRIC_SPECS.length} metric(s) (${rows.length} rows)`,
    );
    return { seasonCode, population: qualified.length, metrics: METRIC_SPECS.length };
  }
}
