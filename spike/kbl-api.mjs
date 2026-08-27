/**
 * KBL 데이터 소스 스파이크
 *
 * 목적: 기획서(plan.md)가 요구하는 데이터를 실제로 확보할 수 있는지 검증한다.
 * 결론: KBL 공식 사이트(SPA)가 사용하는 내부 API 2곳에서 인증 없이 전부 확보 가능.
 *
 *   - kbl-api.sports2i.com/api/v1  : 메타데이터(시즌/대회/코드/필터)
 *   - api-stats.kbl.or.kr/api      : 선수/팀 기록 (traditional + advanced)
 *
 * 실행: node spike/kbl-api.mjs
 */

const META = "https://kbl-api.sports2i.com/api/v1";
const STATS = "https://api-stats.kbl.or.kr/api";

// Referer는 필수다. 없으면 api-stats가 401 "로그인이 필요합니다"를 반환한다.
const HEADERS = {
  "User-Agent": "kbl-stats-spike/0.1 (personal portfolio project)",
  Origin: "https://www.kbl.or.kr",
  Referer: "https://www.kbl.or.kr/",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} :: ${url}`);
  const json = await res.json();
  await sleep(300); // 초당 3회 이하로 제한
  return json;
}

/** 최근 시즌 코드. seasonCode는 연도가 아니라 일련번호다 (2025-2026 = 47). */
export const getRecentSeason = () =>
  get(`${META}/Common/recent-seasons?seriesCd=1`).then((r) => r.data);

/** 대회 구분 코드. gameCode는 제로 패딩 문자열이다 ("01" = 정규시즌, "1"은 빈 배열). */
export const getGameCodes = (seasonCode) =>
  get(`${META}/Common/kbl-season-game/${seasonCode}`).then((r) => r.gameCode);

// listCn 상한은 200~300 사이다. 300 이상은 500을 반환한다.
const PAGE = 200;

/** 선수 기본 기록(시즌 누적). fdg/fdgA가 전체 야투, fg/fgA는 2점만. */
export const getPlayerTraditional = (seasonCode, gameCode = "01") =>
  get(
    `${STATS}/records/player/general/traditional` +
      `?seasonCode=${seasonCode}&gameCode=${gameCode}` +
      `&sortDataSc=score&sortOrderSc=DESC&listCn=${PAGE}&pageNo=1&ruleCk=0`,
  ).then((r) => r.data);

/** 선수 어드밴스드 기록. KBL이 이미 계산해 제공한다(단, 일부는 비표준 — README 참고). */
export const getPlayerAdvanced = (seasonCode, gameCode = "01") =>
  get(
    `${STATS}/records/player/general/advanced` +
      `?seasonCode=${seasonCode}&gameCode=${gameCode}` +
      `&sortDataSc=score&sortOrderSc=DESC&listCn=${PAGE}&pageNo=1&ruleCk=0`,
  ).then((r) => r.data);

/**
 * 팀 기록. win/lose/gameCount로 순위 테이블을 파생할 수 있다.
 * 주의: 응답에 teamCode "00" = "합계" 행이 섞여 있다. 순위 계산 시 반드시 제외할 것.
 *       (다만 이 행은 리그 전체 집계를 공짜로 주므로 정규화 용도로는 유용하다.)
 */
export const getTeamTraditional = (seasonCode, gameCode = "01") =>
  get(
    `${STATS}/records/team/general/traditional` +
      `?seasonCode=${seasonCode}&gameCode=${gameCode}` +
      `&sortDataSc=score&sortOrderSc=DESC`,
  ).then((r) => r.data);

/** 표준 TS% 공식. API의 tsRt와 대조해 데이터 신뢰도를 검증하는 용도. */
const trueShooting = (pts, fga, fta) => (100 * pts) / (2 * (fga + 0.44 * fta));

/** 표준 USG% 공식 (Basketball-Reference). */
const usage = (p, tm) =>
  (100 * (p.fdgA + 0.44 * p.ftA + p.tO) * (tm.playSec / 5)) /
  (p.playSec * (tm.fdgA + 0.44 * tm.ftA + tm.tO));

async function main() {
  const [season] = await getRecentSeason();
  console.log(`시즌: ${season.seasonName1} (seasonCode=${season.seasonCode})\n`);

  const codes = await getGameCodes(season.seasonCode);
  console.log("대회 구분:", codes.map((c) => `${c.GAME_CODE}=${c.GAME_NAME_1}`).join(", "), "\n");

  const [trad, adv, teamsRaw] = await Promise.all([
    getPlayerTraditional(season.seasonCode),
    getPlayerAdvanced(season.seasonCode),
    getTeamTraditional(season.seasonCode),
  ]);

  const teams = teamsRaw.filter((t) => t.teamCode !== "00");
  const leagueTotal = teamsRaw.find((t) => t.teamCode === "00");
  const teamBy = new Map(teams.map((t) => [t.teamCode, t]));
  const advBy = new Map(adv.map((p) => [p.playerNo, p]));

  console.log(`선수 ${trad.length}명 / 팀 ${teams.length}개 확보`);
  console.log(`리그 전체: ${leagueTotal.gameCount}경기, ${leagueTotal.score}득점\n`);

  // 검증 1: API의 어드밴스드 스탯이 표준 공식과 일치하는가?
  console.log("── 어드밴스드 스탯 교차검증 (API 값 vs 표준 공식) ──");
  for (const p of trad.slice(0, 5)) {
    const a = advBy.get(p.playerNo);
    const tm = teamBy.get(p.teamCode);
    const myTs = trueShooting(p.score, p.fdgA, p.ftA);
    const myUsg = usage(p, tm);
    const tsOk = Math.abs(myTs - (a?.tsRt ?? 0)) < 0.01;
    const usgOk = Math.abs(myUsg - (a?.usgRt ?? 0)) < 1;
    console.log(
      `${p.kname.padEnd(9)}` +
        ` TS%: API=${(a?.tsRt ?? 0).toFixed(1).padStart(5)} 직접=${myTs.toFixed(1).padStart(5)} ${tsOk ? "✅" : "⚠️"}` +
        `  USG%: API=${(a?.usgRt ?? 0).toFixed(1).padStart(5)} 직접=${myUsg.toFixed(1).padStart(5)} ${usgOk ? "✅" : "⚠️"}`,
    );
  }

  // 검증 2: 출전 시간 분포 — percentile 자격 기준을 정하려면 이게 필요하다.
  const teamGames = Math.max(...teams.map((t) => t.gameCount));
  const qualified = trad.filter(
    (p) => p.gameCount >= teamGames * 0.7 && p.playSec / 60 / p.gameCount >= 15,
  );
  const mins = trad.map((p) => p.playSec / 60).sort((a, b) => b - a);
  console.log(`\n── Percentile 표본 ──`);
  console.log(`팀당 ${teamGames}경기 / 전체 ${trad.length}명 → 자격 통과 ${qualified.length}명`);
  console.log(`(기준: ${Math.ceil(teamGames * 0.7)}경기 이상 && 경기당 15분 이상)`);
  console.log(`→ 1명당 percentile 해상도: ${(100 / qualified.length).toFixed(2)}%p`);
  console.log(`전체 출전시간: 최다 ${mins[0].toFixed(0)}분 / 최소 ${mins.at(-1).toFixed(0)}분`);
  console.log(`→ 최소 1분짜리 선수가 분포에 섞이면 "리그 상위 X%"는 무의미해진다.`);
}

// 직접 실행할 때만 리포트를 출력한다 (모듈로 import하면 실행되지 않음).
// 직접 실행할 때만 리포트를 출력한다 (모듈로 import하면 실행되지 않음).
if (process.argv[1]?.endsWith("kbl-api.mjs")) {
  main().catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  });
}
