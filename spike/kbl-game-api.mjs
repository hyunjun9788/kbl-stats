/**
 * KBL 경기 API 스파이크 (2차)
 *
 * 1차(kbl-api.mjs)에서 못 찾은 3가지를 확인한다.
 *   - 경기 일정 / 결과  → Elo 학습 및 /schedule 페이지
 *   - 경기별 박스스코어  → 선수 상세 "최근 10경기", PIE 재계산
 *   - 선수 프로필       → 신장, 등번호, 포지션
 *
 * 실행: node spike/kbl-game-api.mjs
 */

const GAME = "https://api.kbl.or.kr";
const META = "https://kbl-api.sports2i.com/api/v1";

/**
 * api.kbl.or.kr은 Referer만으로는 부족하다.
 * Channel / TeamCode / lang 이 없으면 500 "필수 헤더 정보가 누락되었습니다"를 반환한다.
 */
const GAME_HEADERS = {
  "User-Agent": "kbl-stats-spike/0.1 (personal portfolio project)",
  Referer: "https://www.kbl.or.kr/",
  Origin: "https://www.kbl.or.kr",
  "X-Requested-With": "XMLHttpRequest",
  Channel: "WEB",
  TeamCode: "00",
  lang: "ko",
};

const META_HEADERS = {
  "User-Agent": "kbl-stats-spike/0.1 (personal portfolio project)",
  Referer: "https://www.kbl.or.kr/",
  Origin: "https://www.kbl.or.kr",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} :: ${url}`);
  const json = await res.json();
  await sleep(300);
  return json;
}

/** 기록이 존재하는 연도 목록. 1997 ~ 2027. */
export const getYears = () => get(`${GAME}/match/year`, GAME_HEADERS);

/**
 * 기간별 경기 목록. fromDate/toDate는 YYYYMMDD.
 * 주의: KBL 1군(seasonCategory "R")과 D리그가 한 응답에 섞여 나온다.
 */
export const getMatches = (fromDate, toDate) =>
  get(`${GAME}/match/list?fromDate=${fromDate}&toDate=${toDate}`, GAME_HEADERS);

/** KBL 정규시즌 경기만 필터링한다. */
export const onlyRegularSeason = (matches) =>
  matches.filter((g) => g.seasonCategory === "R" && g.gameCode === "01");

/** 경기별 선수 박스스코어. gmkey 형식: S47G01N214 (시즌/대회/경기번호) */
export const getBoxScore = (gmkey) =>
  get(`${GAME}/match/${gmkey}/player-stat`, GAME_HEADERS);

/** 경기별 팀 기록. */
export const getTeamRecord = (gmkey) =>
  get(`${GAME}/match/${gmkey}/team-record`, GAME_HEADERS);

/** 슛 좌표, 쿼터별 득점 추이, 경기 베스트 플레이어. */
export const getMatchChart = (gmkey) =>
  get(`${GAME}/match/${gmkey}/match-chart`, GAME_HEADERS);

/** 선수 프로필 목록 (신장/체중/등번호/포지션). listCn, pageNo 필수. */
export const getPlayers = (seasonCode, listCn = 200, pageNo = 1) =>
  get(`${META}/players?seasonCode=${seasonCode}&listCn=${listCn}&pageNo=${pageNo}`, META_HEADERS);

async function main() {
  const years = await getYears();
  console.log(`기록 보유 연도: ${years.at(-1)} ~ ${years[0]} (${years.length}개)\n`);

  // 1) 지난 시즌 경기 결과 — Elo 학습 데이터
  const past = onlyRegularSeason(await getMatches("20260301", "20260331"));
  console.log(`── 경기 결과 (2026-03) ──`);
  console.log(`정규시즌 ${past.length}경기`);
  for (const g of past.slice(0, 3)) {
    console.log(`  ${g.gameDate} ${g.tnameH} ${g.scoreH}:${g.scoreA} ${g.tnameA}  ${g.gmkey}`);
  }

  // 2) 다음 시즌 일정 — 예정 경기가 있어야 Elo 예상 승률을 노출할 수 있다
  const upcoming = onlyRegularSeason(await getMatches("20261001", "20261031"));
  const scheduled = upcoming.filter((g) => g.isEnded === 0);
  console.log(`\n── 다가오는 경기 (2026-10) ──`);
  console.log(`예정 ${scheduled.length}경기 / 시즌 ${upcoming[0]?.seasonName1} (seasonCode=${upcoming[0]?.seasonCode})`);
  for (const g of scheduled.slice(0, 3)) {
    console.log(`  ${g.gameDate} ${g.gameStart} ${g.tnameH} vs ${g.tnameA} @${g.stadiumname}`);
  }

  // 3) 박스스코어 — 경기 단위 데이터가 있으면 PIE/PER을 직접 재계산할 수 있다
  const gmkey = past[0].gmkey;
  const [box, teamRec, chart] = await Promise.all([
    getBoxScore(gmkey),
    getTeamRecord(gmkey),
    getMatchChart(gmkey),
  ]);
  console.log(`\n── 박스스코어 (${gmkey}) ──`);
  console.log(`선수 ${box.length}명 / 팀 ${teamRec.length}개`);
  const top = [...box].sort((a, b) => b.records.score - a.records.score)[0];
  console.log(
    `최다득점: ${top.player.pname} (#${top.player.backNum} ${top.player.pos}) ` +
      `${top.records.score}점 ${top.records.rb}리바 ${top.records.ast}어시 ` +
      `| PER=${top.records.per} TS%=${top.records.tsRt} USG%=${top.records.usgRt} PIE=${top.records.pie}`,
  );
  console.log(`슛 좌표 로그: ${chart.shootLog.length}명분 (x/y/성공여부/쿼터)`);
  console.log(`쿼터별 득점 추이: ${Object.keys(chart.scoreChart.home).join(", ")}`);

  // 경기 단위 usgRt는 정상 스케일인지 확인 (시즌 집계는 5배가량 작았다)
  const usgs = box.filter((p) => p.records.playMin >= 10).map((p) => p.records.usgRt);
  const avgUsg = usgs.reduce((a, b) => a + b, 0) / usgs.length;
  console.log(
    `\n경기 단위 USG% 평균(10분 이상 ${usgs.length}명): ${avgUsg.toFixed(1)}% ` +
      `${avgUsg > 15 ? "✅ 정상 스케일" : "⚠️ 비정상"}`,
  );

  // 4) 선수 프로필
  const { playerList, totalCn } = await getPlayers(47, 3);
  console.log(`\n── 선수 프로필 ──`);
  console.log(`응답 totalCn=${totalCn} (시즌 필터가 적용되지 않는 것으로 보임 — 확인 필요)`);
  for (const p of playerList) {
    console.log(`  ${p.kname} #${p.backNum} ${p.pos} ${p.pHeight}cm ${p.pWeight}kg`);
  }
}

if (process.argv[1]?.endsWith("kbl-game-api.mjs")) {
  main().catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  });
}
