export interface TeamOption {
  id: number;
  name: string;
}

interface PlayersFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  team: string;
  onTeamChange: (value: string) => void;
  teamOptions: TeamOption[];
  position: string;
  onPositionChange: (value: string) => void;
  positionOptions: string[];
  totalCount: number;
  filteredCount: number;
}

/** 표시 + 상태 반영만 한다. 상태 자체는 PlayersExplorer가 들고 있다. */
export function PlayersFilterBar({
  search,
  onSearchChange,
  team,
  onTeamChange,
  teamOptions,
  position,
  onPositionChange,
  positionOptions,
  totalCount,
  filteredCount,
}: PlayersFilterBarProps) {
  const isFiltered = search.trim() !== "" || team !== "all" || position !== "all";

  return (
    <div className="flex flex-col gap-4 border-b border-black/5 p-6 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <select
          disabled
          defaultValue="47"
          className="cursor-not-allowed rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-foreground/80"
        >
          <option value="47">2025-26 (시즌 47)</option>
        </select>

        <select
          value={team}
          onChange={(e) => onTeamChange(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-foreground/80"
        >
          <option value="all">전체 팀</option>
          {teamOptions.map((t) => (
            <option key={t.id} value={String(t.id)}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={position}
          onChange={(e) => onPositionChange(e.target.value)}
          className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-foreground/80"
        >
          <option value="all">전체 포지션</option>
          {positionOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="선수명 검색..."
          className="w-48 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm placeholder:text-foreground/40"
        />
      </div>

      <p className="shrink-0 text-sm text-foreground/50">
        {isFiltered
          ? `총 ${totalCount}명 중 ${filteredCount}명이 검색되었습니다.`
          : `총 ${totalCount}명의 선수가 등록되어 있습니다.`}
      </p>
    </div>
  );
}
