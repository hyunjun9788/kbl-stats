"use client";

import { useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { PlayerListItem } from "@/lib/api";
import { PlayerAvatar } from "./player-avatar";
import { TeamBadge } from "./team-badge";

const PAGE_SIZE = 10;

const COLUMNS = [
  "#",
  "선수",
  "팀",
  "포지션",
  "경기수",
  "득점",
  "리바운드",
  "어시스트",
  "TS%",
  "PER",
] as const;

function fmt(value: number | null, digits = 1): string {
  return value === null ? "-" : value.toFixed(digits);
}

/**
 * 유일한 Client Component. API가 페이지네이션을 지원하지 않아 서버가 넘겨준
 * 전체 배열을 그대로 받아 브라우저에서 10개씩 잘라 보여준다. 검색/필터/정렬은
 * 아직 없다 — players 배열은 서버가 준 순서(경기당 득점 내림차순) 그대로다.
 */
export function PlayersTable({ players }: { players: PlayerListItem[] }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(players.length / PAGE_SIZE));
  const paged = useMemo(
    () => players.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [players, page],
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold text-foreground/40">
              {COLUMNS.map((label, i) => (
                <th
                  key={label}
                  className={[
                    i === 0 ? "px-6" : i === COLUMNS.length - 1 ? "px-6" : "px-2",
                    "py-3 font-semibold",
                    i >= 4 ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((player, index) => (
              <tr
                key={player.playerId}
                className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
              >
                <td className="tabular-nums px-6 py-3 text-foreground/40">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar name={player.koreanName} />
                    <div>
                      <p className="font-semibold text-foreground">{player.koreanName}</p>
                      {player.englishName ? (
                        <p className="text-xs text-foreground/40">{player.englishName}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    <TeamBadge code={player.team.kblTeamCode} shortName={player.team.shortName} />
                    <span className="text-foreground/80">{player.team.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-foreground/60">{player.position ?? "-"}</td>
                <td className="tabular-nums px-2 py-3 text-right">{player.games}</td>
                <td className="tabular-nums px-2 py-3 text-right font-semibold text-foreground">
                  {fmt(player.pts)}
                </td>
                <td className="tabular-nums px-2 py-3 text-right">{fmt(player.reb)}</td>
                <td className="tabular-nums px-2 py-3 text-right">{fmt(player.ast)}</td>
                <td className="tabular-nums px-2 py-3 text-right">{fmt(player.tsPct)}</td>
                <td className="tabular-nums px-6 py-3 text-right text-foreground/40">
                  {fmt(player.per)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1">
          <PageButton
            aria-label="이전 페이지"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </PageButton>
          {pageNumbers(page, pageCount).map((n, i) =>
            n === "…" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-foreground/30">
                …
              </span>
            ) : (
              <PageButton key={n} active={n === page} onClick={() => setPage(n)}>
                {n}
              </PageButton>
            ),
          )}
          <PageButton
            aria-label="다음 페이지"
            disabled={page === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            ›
          </PageButton>
        </div>

        <select
          disabled
          defaultValue={String(PAGE_SIZE)}
          className="cursor-not-allowed rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-foreground/60"
        >
          <option value={PAGE_SIZE}>페이지당 {PAGE_SIZE}개</option>
        </select>
      </div>
    </div>
  );
}

/** 1 2 3 4 5 … 21 처럼 앞/뒤/현재 주변만 보여주고 나머지는 … 로 접는다. */
function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) {
      result.push("…");
    }
    result.push(n);
    prev = n;
  }
  return result;
}

function PageButton({
  children,
  active,
  disabled,
  ...rest
}: {
  children: ReactNode;
  active?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
        active ? "bg-navy-950 text-white" : "text-foreground/60 hover:bg-black/5",
        disabled ? "cursor-not-allowed opacity-30 hover:bg-transparent" : "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
