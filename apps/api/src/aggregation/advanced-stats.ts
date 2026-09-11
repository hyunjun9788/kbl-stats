/**
 * 선수 "자신의" 시즌 합계만으로 계산되는 어드밴스드 스탯 (설계 문서의 A그룹).
 * 팀/리그 데이터가 필요 없는 지표만 여기 둔다 — USG%/AST%(B그룹), PER(C그룹)은
 * 각각 팀 시즌 합계·리그 전체 합계가 필요해서 별도 위치에서 계산한다.
 *
 * 전부 0~100 스케일(퍼센트)로 반환한다. KBL의 src* 컬럼과 같은 스케일이라 검산이 쉽다.
 * 분모가 0이면(야투 시도가 아예 없는 선수) null — 0으로 나누는 대신 "계산 불가"를 표현한다.
 */

/** True Shooting % = PTS / (2 × (FGA + 0.44×FTA)) × 100 */
export function trueShootingPct(
  points: number,
  fga: number,
  fta: number,
): number | null {
  const denominator = 2 * (fga + 0.44 * fta);
  return denominator > 0 ? (100 * points) / denominator : null;
}

/** Effective FG% = (FGM + 0.5×3PM) / FGA × 100 */
export function effectiveFgPct(
  fgm: number,
  fg3m: number,
  fga: number,
): number | null {
  return fga > 0 ? (100 * (fgm + 0.5 * fg3m)) / fga : null;
}

/** Turnover % = TOV / (FGA + 0.44×FTA + TOV) × 100 */
export function turnoverPct(
  tov: number,
  fga: number,
  fta: number,
): number | null {
  const denominator = fga + 0.44 * fta + tov;
  return denominator > 0 ? (100 * tov) / denominator : null;
}
