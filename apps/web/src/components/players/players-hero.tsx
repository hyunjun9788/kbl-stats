export function PlayersHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
      {/* 실제 사진 대신 코트 링을 추상화한 장식. 저작권 있는 이미지를 쓰지 않는다. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -right-32 h-[440px] w-[440px] -translate-y-1/2 rounded-full border-[26px] border-white/[0.06]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-20 h-[440px] w-px -translate-y-1/2 bg-white/[0.06]"
      />

      <div className="relative mx-auto flex max-w-7xl items-end justify-between gap-8 px-6 pt-14 pb-16">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-accent-500">PLAYERS</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">선수 기록</h1>
          <p className="mt-3 max-w-md text-sm text-white/60">
            KBL 선수들의 시즌 기록과 다양한 지표를 한눈에 확인하세요.
          </p>
        </div>

        <div className="hidden shrink-0 text-right text-[11px] leading-relaxed font-semibold tracking-[0.2em] text-white/40 md:block">
          <p>KOREA BASKETBALL LEAGUE</p>
          <p>DATA DRIVES</p>
          <p>A DEEPER GAME</p>
        </div>
      </div>
    </section>
  );
}
