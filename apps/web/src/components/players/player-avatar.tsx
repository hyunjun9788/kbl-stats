// 선수 사진 URL도 아직 DB에 없다 (Player에 photo 컬럼 자체가 없음).
// 실제 사진이 들어오면 이 컴포넌트만 <img>로 바꾸면 된다.
export function PlayerAvatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-950/5 text-sm font-semibold text-navy-950/50 ring-1 ring-inset ring-black/5"
    >
      {name.slice(0, 1)}
    </span>
  );
}
