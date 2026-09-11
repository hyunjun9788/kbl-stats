import { BadRequestException, Injectable } from '@nestjs/common';
import { perGame } from '../aggregation/advanced-stats.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface PlayerListItem {
  playerId: number;
  kblPlayerNo: string;
  koreanName: string;
  englishName: string | null;
  position: string | null;
  team: { id: number; kblTeamCode: string; name: string; shortName: string };
  games: number;
  gamesStarted: number;
  pts: number | null;
  reb: number | null;
  ast: number | null;
  tsPct: number | null;
  per: number | null;
}

/**
 * plan.md 6장 "선수 목록" 표에 필요한 최소 데이터만 우선 만든다.
 * 검색/필터/정렬 옵션은 다음 단위에서 추가한다.
 */
@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async listBySeason(seasonCode: number): Promise<PlayerListItem[]> {
    const season = await this.prisma.season.findUnique({
      where: { kblSeasonCode: seasonCode },
    });
    if (!season) {
      throw new BadRequestException(`unknown season code ${seasonCode}`);
    }

    const rows = await this.prisma.playerSeasonStat.findMany({
      where: { seasonId: season.id },
      include: { player: true, team: true },
    });

    const items = rows.map((row) => ({
      playerId: row.playerId,
      kblPlayerNo: row.player.kblPlayerNo,
      koreanName: row.player.koreanName,
      englishName: row.player.englishName,
      position: row.player.position,
      team: {
        id: row.team.id,
        kblTeamCode: row.team.kblTeamCode,
        name: row.team.name,
        shortName: row.team.shortName,
      },
      games: row.games,
      gamesStarted: row.gamesStarted ?? 0,
      pts: perGame(row.points, row.games),
      reb: perGame(row.reb, row.games),
      ast: perGame(row.ast, row.games),
      tsPct: row.tsPct,
      per: row.per,
    }));

    // 경기당 득점(평균) 기준 정렬 — 시즌 누적 득점으로 정렬하면 출전 경기 수가
    // 다른 선수끼리 순위가 왜곡된다(스탯 사이트의 표준은 경기당 평균).
    // DB 컬럼이 아니라 계산값이라 Prisma orderBy로는 못하고 여기서 정렬한다.
    return items.sort((a, b) => (b.pts ?? -Infinity) - (a.pts ?? -Infinity));
  }
}
