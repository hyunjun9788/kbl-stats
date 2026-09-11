export interface TeamOption {
  id: number;
  name: string;
}

interface PlayersFilterBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  team: string;
  onTeamChange: (value: string) => void;
  teamOptions: TeamOption[];
  position: string;
  onPositionChange: (value: string) => void;
  positionOptions: string[];
  totalCount: number;
  filteredCount: number;
  isFiltered: boolean;
}

/**
 * 표시 + 상태 반영만 한다. 상태 자체는 PlayersExplorer가 들고 있다.
 * 팀/포지션은 선택 즉시 반영되지만, 검색은 타이핑마다 반응하지 않고
 * 폼 제출(Enter 또는 검색 버튼)에만 반영된다.
 */
export function PlayersFilterBar({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  team,
  onTeamChange,
  teamOptions,
  position,
  onPositionChange,
  positionOptions,
  totalCount,
  filteredCount,
  isFiltered,
}: PlayersFilterBarProps) {
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="flex items-center gap-2"
        >
          <input
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="선수명 검색..."
            className="w-48 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm placeholder:text-foreground/40"
          />
          <button
            type="submit"
            className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-900"
          >
            검색
          </button>
        </form>
      </div>

      <p className="shrink-0 text-sm text-foreground/50">
        {isFiltered
          ? `총 ${totalCount}명 중 ${filteredCount}명이 검색되었습니다.`
          : `총 ${totalCount}명의 선수가 등록되어 있습니다.`}
      </p>
    </div>
  );
}
