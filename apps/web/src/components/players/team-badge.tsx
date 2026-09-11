// 실제 팀 로고/컬러 자산이 아직 없다 (Team.colorPrimary/Secondary가 비어있음).
// plan.md 11장 "교체 가능한 구조"를 따라 이니셜 배지로 대체한다 — 나중에 실제
// 로고/컬러가 생기면 이 컴포넌트 내부만 바꾸면 된다.
const PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

function colorForTeam(code: string): string {
  let hash = 0;
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash * 31 + code.charCodeAt(i)) % PALETTE.length;
  }
  return PALETTE[Math.abs(hash)];
}

export function TeamBadge({ code, shortName }: { code: string; shortName: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
      style={{ backgroundColor: colorForTeam(code) }}
    >
      {shortName.slice(0, 3)}
    </span>
  );
}
