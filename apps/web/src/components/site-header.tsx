import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/players", label: "선수" },
  { href: "/teams", label: "팀" },
  { href: "/compare", label: "비교" },
];

// TODO: 페이지가 더 생기면 usePathname 기반 NavLink(client)로 바꿔 활성 탭을 자동 계산한다.
// 지금은 /players 하나뿐이라 하드코딩한다.
const ACTIVE_HREF = "/players";

export function SiteHeader() {
  return (
    <header className="bg-navy-950 text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span aria-hidden>🏀</span>
          KBL STATS
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-white/60">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.href === ACTIVE_HREF
                  ? "border-b-2 border-accent-500 pb-1 text-white"
                  : "border-b-2 border-transparent pb-1 transition-colors hover:text-white"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <label className="hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/50 sm:flex">
            <SearchIcon />
            <input
              disabled
              placeholder="선수명, 팀명 검색..."
              className="w-40 cursor-not-allowed bg-transparent placeholder:text-white/40 focus:outline-none"
            />
          </label>
          <select
            disabled
            defaultValue="47"
            className="cursor-not-allowed rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80"
          >
            <option value="47">2025-26 (시즌 47)</option>
          </select>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      className="h-4 w-4 shrink-0"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="m17 17-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
