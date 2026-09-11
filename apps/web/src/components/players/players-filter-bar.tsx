// 시즌/팀/포지션/검색 — 지금은 표시만 하고 동작은 붙이지 않는다 (요청사항).
// disabled 로 "아직 연결 안 됨"을 명시적으로 드러낸다.
export function PlayersFilterBar({ totalCount }: { totalCount: number }) {
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
          disabled
          defaultValue="all"
          className="cursor-not-allowed rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-foreground/80"
        >
          <option value="all">전체 팀</option>
        </select>
        <select
          disabled
          defaultValue="all"
          className="cursor-not-allowed rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-foreground/80"
        >
          <option value="all">전체 포지션</option>
        </select>
        <input
          disabled
          placeholder="선수명 검색..."
          className="w-48 cursor-not-allowed rounded-lg border border-black/10 bg-white px-3 py-2 text-sm placeholder:text-foreground/40"
        />
      </div>

      <p className="shrink-0 text-sm text-foreground/50">
        총 {totalCount}명의 선수가 등록되어 있습니다.
      </p>
    </div>
  );
}
