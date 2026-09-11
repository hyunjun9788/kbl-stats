import { PlayersFilterBar } from "@/components/players/players-filter-bar";
import { PlayersHero } from "@/components/players/players-hero";
import { PlayersTable } from "@/components/players/players-table";
import { getPlayers } from "@/lib/api";

// TODO: Season.isCurrent 가 생기면 그걸로 대체. 지금은 시즌47(2025-26) 하드코딩.
const CURRENT_SEASON_CODE = 47;

export default async function PlayersPage() {
  const players = await getPlayers(CURRENT_SEASON_CODE);

  return (
    <div>
      <PlayersHero />
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <PlayersFilterBar totalCount={players.length} />
          <PlayersTable players={players} />
        </div>
      </div>
      <div className="h-16" />
    </div>
  );
}
