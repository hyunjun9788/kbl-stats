export function SiteFooter() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-foreground/50 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold text-foreground/80">KBL STATS</p>
          <p className="mt-1 text-xs">Korea Basketball League — Data Drives a Deeper Game.</p>
        </div>

        <nav className="flex gap-4 text-xs">
          <span>소개</span>
          <span>이용약관</span>
          <span>개인정보처리방침</span>
        </nav>

        <p className="text-xs">© 2025 KBL STATS. All rights reserved.</p>
      </div>
    </footer>
  );
}
