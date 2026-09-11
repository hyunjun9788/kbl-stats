"use client";

import { useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { PlayerListItem } from "@/lib/api";
import { PlayerAvatar } from "./player-avatar";
import { PlayersFilterBar, type TeamOption } from "./players-filter-bar";
import { TeamBadge } from "./team-badge";

const PAGE_SIZE = 20;

type SortKey = "games" | "pts" | "reb" | "ast" | "tsPct";

interface ColumnDef {
  key: string;
  label: string;
  sortKey?: SortKey;
  align: "left" | "right";
}

const COLUMNS: ColumnDef[] = [
  { key: "rank", label: "#", align: "left" },
  { key: "name", label: "선수", align: "left" },
  { key: "team", label: "팀", align: "left" },
  { key: "position", label: "포지션", align: "left" },
  { key: "games", label: "경기수", sortKey: "games", align: "right" },
  { key: "pts", label: "득점", sortKey: "pts", align: "right" },
  { key: "reb", label: "리바운드", sortKey: "reb", align: "right" },
  { key: "ast", label: "어시스트", sortKey: "ast", align: "right" },
  { key: "tsPct", label: "TS%", sortKey: "tsPct", align: "right" },
  { key: "per", label: "PER", align: "right" },
];

function fmt(value: number | null, digits = 1): string {
  return value === null ? "-" : value.toFixed(digits);
}

/** null은 정렬 방향과 무관하게 항상 맨 뒤로 보낸다 (PER처럼 값이 아예 없는 경우). */
function sortPlayers(
  players: PlayerListItem[],
  key: SortKey,
  dir: "asc" | "desc",
): PlayerListItem[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...players].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return (av - bv) * factor;
  });
}

/**
 * 검색/필터/정렬/페이지네이션을 전부 여기서 처리한다. API가 시즌 전체(201명)를
 * 한 번에 주므로, 서버에 다시 묻지 않고 이미 받은 배열을 그때그때 걸러서/
 * 정렬해서 보여준다 — TanStack Query 같은 서버 상태 라이브러리가 필요 없다.
 */
export function PlayersExplorer({ players }: { players: PlayerListItem[] }) {
  const [searchInput, setSearchInput] = useState(""); // 타이핑 중인 값 — 필터링에 안 쓰인다
  const [search, setSearch] = useState(""); // 제출(Enter/검색 버튼)해야 이 값이 바뀐다
  const [team, setTeam] = useState("all");
  const [position, setPosition] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("pts");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const teamOptions = useMemo<TeamOption[]>(() => {
    const map = new Map<number, TeamOption>();
    for (const p of players) {
      if (!map.has(p.team.id)) {
        map.set(p.team.id, { id: p.team.id, name: p.team.name });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [players]);

  const positionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of players) {
      if (p.position) {
        set.add(p.position);
      }
    }
    return [...set].sort();
  }, [players]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) => {
      if (team !== "all" && String(p.team.id) !== team) {
        return false;
      }
      if (position !== "all" && p.position !== position) {
        return false;
      }
      if (q) {
        const hit =
          p.koreanName.toLowerCase().includes(q) ||
          (p.englishName?.toLowerCase().includes(q) ?? false) ||
          p.team.name.toLowerCase().includes(q);
        if (!hit) {
          return false;
        }
      }
      return true;
    });
  }, [players, search, team, position]);

  const sorted = useMemo(
    () => sortPlayers(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 검색/필터/정렬이 바뀌면 이전에 보던 페이지 번호가 더는 유효하지 않을 수 있으니,
  // effect가 아니라 각 변경 시점에 바로 1페이지로 되돌린다.
  function submitSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  function updateTeam(value: string) {
    setTeam(value);
    setPage(1);
  }

  function updatePosition(value: string) {
    setPosition(value);
    setPage(1);
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  return (
    <div>
      <PlayersFilterBar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={submitSearch}
        team={team}
        onTeamChange={updateTeam}
        teamOptions={teamOptions}
        position={position}
        onPositionChange={updatePosition}
        positionOptions={positionOptions}
        totalCount={players.length}
        filteredCount={filtered.length}
        isFiltered={search.trim() !== "" || team !== "all" || position !== "all"}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs font-semibold text-foreground/40">
              {COLUMNS.map((col, i) => {
                const key = col.sortKey;
                return (
                  <th
                    key={col.key}
                    className={[
                      i === 0 ? "px-6" : i === COLUMNS.length - 1 ? "px-6" : "px-2",
                      "py-3 font-semibold",
                      col.align === "right" ? "text-right" : "text-left",
                    ].join(" ")}
                  >
                    {key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className={[
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground/70",
                          col.align === "right" ? "flex-row-reverse" : "",
                          sortKey === key ? "text-foreground/80" : "",
                        ].join(" ")}
                      >
                        {col.label}
                        <span className="w-2.5 text-[10px]">
                          {sortKey === key ? (sortDir === "desc" ? "▼" : "▲") : ""}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paged.map((player, index) => (
              <tr
                key={player.playerId}
                className="border-b border-black/5 last:border-0 hover:bg-black/[0.015]"
              >
                <td className="tabular-nums px-6 py-3 text-foreground/40">
                  {(currentPage - 1) * PAGE_SIZE + index + 1}
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
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-6 py-16 text-center text-sm text-foreground/40"
                >
                  조건에 맞는 선수가 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1">
          <PageButton
            aria-label="이전 페이지"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </PageButton>
          {pageNumbers(currentPage, pageCount).map((n, i) =>
            n === "…" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-foreground/30">
                …
              </span>
            ) : (
              <PageButton key={n} active={n === currentPage} onClick={() => setPage(n)}>
                {n}
              </PageButton>
            ),
          )}
          <PageButton
            aria-label="다음 페이지"
            disabled={currentPage === pageCount}
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

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * 1 … 3 4 5 … 11 처럼 현재 페이지를 중심으로 좌우 대칭인 창 + 처음/끝만 보여준다.
 * "1 2 3 4 5 … 10 11"(비대칭) 대신 표준적인 가운데 정렬 페이지네이션 패턴.
 */
function pageNumbers(
  current: number,
  total: number,
  siblingCount = 1,
): (number | "…")[] {
  const totalNumbers = siblingCount * 2 + 5; // 처음 + 끝 + 현재 + 양옆 형제 + 여유
  if (total <= totalNumbers) {
    return range(1, total);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  if (!showLeftDots && showRightDots) {
    return [...range(1, 3 + 2 * siblingCount), "…", total];
  }
  if (showLeftDots && !showRightDots) {
    return [1, "…", ...range(total - (3 + 2 * siblingCount) + 1, total)];
  }
  return [1, "…", ...range(leftSibling, rightSibling), "…", total];
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
