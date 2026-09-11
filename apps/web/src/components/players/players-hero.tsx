export function PlayersHero() {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      {/* 실제 사진 배경. 왼쪽(텍스트 영역)은 어둡게 눌러 가독성을 확보한다. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/players-bg.webp')] bg-cover bg-right bg-no-repeat"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/70 to-navy-950/40"
      />

      <div className="relative mx-auto flex max-w-7xl items-end justify-between gap-8 px-6 pt-14 pb-16">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-accent-500">PLAYERS</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">선수 기록</h1>
          <p className="mt-3 max-w-md text-sm text-white/60">
            KBL 선수들의 시즌 기록과 다양한 지표를 한눈에 확인하세요.
          </p>
        </div>

        <div className="hidden shrink-0 text-right text-[11px] leading-relaxed font-semibold tracking-[0.2em] text-white/70 md:block">
          <p>KOREA BASKETBALL LEAGUE</p>
          <p>DATA DRIVES</p>
          <p>A DEEPER GAME</p>
        </div>
      </div>
    </section>
  );
}
