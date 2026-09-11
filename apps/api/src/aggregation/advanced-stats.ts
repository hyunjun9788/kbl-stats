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

/**
 * B그룹 — 선수 자신의 시즌 합계 + "그 선수가 속한 팀의 시즌 전체 합계"가 필요한 지표.
 * 분/초 단위는 무관하다(분자·분모에 같은 단위가 들어가 비율에서 상쇄된다) —
 * 우리는 secondsPlayed를 그대로 넘기면 된다.
 */

/**
 * Usage % = 100 × ((FGA+0.44FTA+TOV) × (팀_MP/5)) / (MP × (팀_FGA+0.44팀_FTA+팀_TOV))
 * spike/README.md 4장: 자밀 워니 실측값으로 36.3%가 나옴을 확인(팀=시즌 전체 54경기 합계).
 */
export function usagePct(
  playerFga: number,
  playerFta: number,
  playerTov: number,
  playerSeconds: number,
  teamSeconds: number,
  teamFga: number,
  teamFta: number,
  teamTov: number,
): number | null {
  const numerator =
    (playerFga + 0.44 * playerFta + playerTov) * (teamSeconds / 5);
  const denominator = playerSeconds * (teamFga + 0.44 * teamFta + teamTov);
  return denominator > 0 ? (100 * numerator) / denominator : null;
}

/** Assist % = 100 × AST / (((MP / (팀_MP/5)) × 팀_FGM) − FGM) */
export function assistPct(
  playerAst: number,
  playerFgm: number,
  playerSeconds: number,
  teamSeconds: number,
  teamFgm: number,
): number | null {
  if (teamSeconds <= 0) {
    return null;
  }
  const denominator = (playerSeconds / (teamSeconds / 5)) * teamFgm - playerFgm;
  return denominator > 0 ? (100 * playerAst) / denominator : null;
}
