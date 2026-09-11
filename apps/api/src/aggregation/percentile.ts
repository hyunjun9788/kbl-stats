/**
 * 자격 통과 모집단 안에서 순위와 percentile을 계산하는 순수 함수.
 *
 * percentile = 100 × 순위 / 모집단 ("61명 중 3위" → 100×3/61 ≈ 4.9%)
 * 5%p 단위로 반올림하고, "상위 0%"는 말이 안 되므로 최소 5%로 clamp한다
 * (표본이 작아 1명 차이가 percentile 해상도보다 큰 의미를 가지므로 — plan.md 2.1).
 */

export interface RankableEntry {
  id: number;
  value: number;
}

export interface RankedEntry extends RankableEntry {
  rank: number;
  percentileRaw: number;
  percentileBucket: number;
}

export function rankAndPercentile(
  entries: RankableEntry[],
  higherIsBetter: boolean,
): RankedEntry[] {
  const population = entries.length;
  const sorted = [...entries].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value,
  );

  return sorted.map((entry, index) => {
    const rank = index + 1;
    const percentileRaw = (100 * rank) / population;
    const percentileBucket = Math.min(
      100,
      Math.max(5, Math.round(percentileRaw / 5) * 5),
    );
    return { ...entry, rank, percentileRaw, percentileBucket };
  });
}
