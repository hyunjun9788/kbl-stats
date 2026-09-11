/**
 * Percentile 모집단 자격 기준 (plan.md 2.1).
 * 기준 없이 계산하면 3분 출전해 슛 2개를 넣은 선수가 야투율 100%로 1위가 된다.
 */
export function isQualified(
  games: number,
  secondsPlayed: number,
  minGames: number,
  minMinutesPerGame: number,
): boolean {
  if (games === 0) {
    return false;
  }
  const avgMinutesPerGame = secondsPlayed / 60 / games;
  return games >= minGames && avgMinutesPerGame >= minMinutesPerGame;
}
