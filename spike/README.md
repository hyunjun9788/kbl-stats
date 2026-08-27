# 데이터 소스 스파이크 결과

**결론: 데이터 확보 가능. 프로젝트 진행해도 된다.**

`plan.md`의 최대 리스크였던 "KBL 데이터를 실제로 가져올 수 있는가"를 검증했다.
스크래핑(HTML 파싱)이 아니라 **JSON API 직접 호출**로 해결된다.

실행: `node spike/kbl-api.mjs` (기록) / `node spike/kbl-game-api.mjs` (경기·일정)

---

## 1. 데이터 소스

KBL 공식 사이트(`www.kbl.or.kr`)는 React SPA이고, 데이터는 별도 API **3곳**에서 온다.
번들(`/assets/index-*.js`, `kbl-data.sports2i.com/kbl/main.js`)에 엔드포인트가 그대로 노출돼 있다.

| 호스트 | 용도 |
| --- | --- |
| `kbl-api.sports2i.com/api/v1` | 메타데이터 — 시즌, 대회 구분, 코드, 필터 |
| `api-stats.kbl.or.kr/api` | 기록 — 선수/팀 traditional + advanced |
| `api.kbl.or.kr` | 경기 — 일정, 결과, 박스스코어 (6장 참고. **필수 헤더가 다르다**) |

**인증 토큰은 필요 없다.** 단, `api-stats`는 `Referer: https://www.kbl.or.kr/` 헤더가
없으면 `401 Unauthorized`를 반환한다.

## 2. 확보되는 데이터

### 기본 기록 (`/records/player/general/traditional`)
`score, fg, fgA, threep, threepA, fdg, fdgA, ft, ftA, oR, dR, rb, aS, sT, bS, tO,
foulTot, playSec, gameCount, win, lose, dd2, td3, margin` — plan.md의 Basic Stat 전부 커버.

### 어드밴스드 기록 (`/records/player/general/advanced`)
**plan.md가 요구한 7개 지표가 이미 계산되어 제공된다.**

`perRt(PER), pie(PIE), tsRt(TS%), efgRt(eFG%), usgRt(USG%), astRt(AST%), tovRt(TOV%)`
\+ 보너스: `offrtg, defrtg, netrtg, pace, poss, orebRt, drebRt, rebRt, astTo, astRatio`

그 외에도 `shooting`, `shot-dashboard`, `clutch/*`, `hustle`, `opponent-shooting`,
`foul/*`, `lineup/*`, `TeamComparison/*` 등 KBL 공식 사이트에도 잘 노출되지 않는
엔드포인트가 다수 존재한다.

## 3. 주의사항 (실제로 걸린 함정들)

| 항목 | 내용 |
| --- | --- |
| `seasonCode` | 연도가 아니라 일련번호. **2025-2026 시즌 = 47** |
| `gameCode` | 제로 패딩 문자열. `"01"`(정규시즌)이며 `"1"`은 빈 배열 반환 |
| `ruleCk` | `true/false`가 아니라 `0/1`. 빈 값이면 400 |
| `sortDataSc` | 소문자 컬럼명(`score`). 틀리면 500과 함께 **SQL 컬럼명이 그대로 노출됨** |
| `listCn` | 상한 200~300. 300 이상은 500. 193명 전원은 `listCn=200`으로 한 번에 |
| 팀 응답 | `teamCode: "00"` = **합계 행**이 섞여 있다. 순위 계산 시 반드시 제외 |

## 4. 어드밴스드 스탯 신뢰도 — 그대로 쓰면 안 된다

API 값을 표준 공식과 대조한 결과가 지표마다 다르다.

- **TS% — 표준과 완전 일치 (오차 0.0000)** ✅
  자밀 워니: `1158 / (2 × (1091 + 0.44 × 161))` = 49.83, API 값과 동일.

- **USG% — 표준과 불일치** ⚠️
  API는 워니를 `7.2%`로 주지만 표준 공식(Basketball-Reference)은 `36.3%`다.
  전체 127명(200분 이상) 비교 시 비율이 **4.77 ~ 5.27 (중앙값 4.99)** 로 분포한다.
  구조적으로 `× (팀 출전시간 / 5)` 항이 빠진 것으로 보이지만 **정확히 5배가 아니므로
  단순히 5를 곱해서 쓰면 안 된다.** 팀 출전시간 기준이 다른 것으로 추정된다.
  → **6장에서 원인이 좁혀졌다: 경기 단위 `usgRt`는 정상 스케일이다.**
  시즌 집계 과정의 문제로 보인다.

**따라서 이 프로젝트의 어드밴스드 스탯은 raw counting stat에서 직접 계산한다.**
원천 데이터가 전부 제공되므로 가능하고, "직접 계산했다"는 사실 자체가
포트폴리오에서 설명할 거리가 된다. API 값은 **검증용 대조군**으로만 쓴다.
`PER`, `PIE`도 같은 이유로 재계산 전까지 신뢰하지 않는다.

## 5. Percentile 표본 — 자격 기준이 반드시 필요하다

```
팀당 54경기 / 리그 전체 193명
출전시간: 최다 1877분 ~ 최소 1분
자격 기준(38경기 이상 && 경기당 15분 이상) 통과: 61명
→ 1명당 percentile 해상도: 1.64%p
```

- **1분 출전 선수가 분포에 섞이면 "리그 상위 X%"라는 이 서비스의 핵심 메시지가 무너진다.**
- 자격 통과 61명 기준으로 1명 = 1.64%p이므로 **`plan.md`의 "상위 3%" 같은 표기는
  표현할 수 있는 정밀도를 넘어선다.** 등급(A+/A/B+) 또는 "193명 중 5위" 같은
  순위 표기를 병행하는 편이 정직하다.
- 15분 기준은 다소 엄격하므로(61명) 10분/20경기 등으로 조정 검토 필요.

## 6. 경기 API — 세 번째 소스 (`api.kbl.or.kr`)

일정·박스스코어는 앞의 두 API가 아니라 **`api.kbl.or.kr`** 에 있다.
실행: `node spike/kbl-game-api.mjs`

**필수 헤더가 다르다.** `Referer`만으로는 부족하고 아래가 없으면
`500 "필수 헤더 정보가 누락되었습니다"`를 반환한다.

```
Channel: WEB
TeamCode: 00
lang: ko
X-Requested-With: XMLHttpRequest
```

| 엔드포인트 | 내용 |
| --- | --- |
| `/match/year` | 기록 보유 연도 — **1997 ~ 2027 (31개 시즌)** |
| `/match/list?fromDate=&toDate=` | 기간별 경기 목록 (YYYYMMDD) |
| `/match/{gmkey}/player-stat` | **경기별 선수 박스스코어** |
| `/match/{gmkey}/team-record` | 경기별 팀 기록 |
| `/match/{gmkey}/match-chart` | 슛 좌표 + 쿼터별 득점 추이 + 베스트 플레이어 |

- `gmkey` 형식: `S47G01N214` = 시즌47 / 대회01 / 경기번호214
- `/match/list` 응답에는 **KBL 1군과 D리그가 섞여 나온다.**
  `seasonCategory === "R" && gameCode === "01"` 로 정규시즌만 필터링할 것.
- 경기 목록에 `scoreH/scoreA`, `isEnded`, `stadiumname`, `gameStart`가 모두 있어
  **Elo 학습 데이터와 `/schedule` 페이지가 이 하나로 해결된다.**

### 박스스코어에 경기 단위 어드밴스드 스탯이 포함된다

`player-stat`의 `records`에 `per, offrtg, defrtg, netrtg, efgRt, tsRt, astRt, usgRt,
pace, tovRt, pie, poss`가 경기 단위로 들어있다. `player`에는 `backNum, pos, img`도 있다.

**중요: 경기 단위 `usgRt`는 정상 스케일이다.**
10분 이상 출전 선수 평균이 `19.2%`로 이론값(20%)에 부합한다.
반면 4장에서 확인한 **시즌 집계 `usgRt`는 7.2%** 로 약 1/5이었다.
→ 시즌 집계 쪽의 버그로 보이며, **경기 단위 데이터를 직접 합산하는 편이 안전하다는 근거**가 된다.

## 7. 비시즌 문제 해결 — 다음 시즌 일정이 이미 있다

이전 분석에서 "지금은 비시즌이라 홈 화면의 예정 경기·예상 승률이 빈다"고 우려했으나,
**2026-2027 시즌(seasonCode=49) 일정이 이미 공개되어 있다.**

```
2026-10-03 14:00  부산 KCC vs 창원 LG      @부산사직
2026-10-03 14:00  고양 소노 vs 대구 한국가스공사  @고양소노아레나
2026-10-03 16:30  안양 정관장 vs 울산 현대모비스  @안양 정관장 아레나
```

`isEnded=0`인 예정 경기가 확보되므로 Elo 예상 승률을 실제로 노출할 수 있다.
지난 시즌(47) 결과로 Elo를 학습시키고 다음 시즌 경기에 적용하는 구성이 가능하다.

## 8. 선수 프로필

`GET kbl-api.sports2i.com/api/v1/players?seasonCode=47&listCn=200&pageNo=1`
(`listCn`, `pageNo` 필수)

`playerNo, kname, ename, teamCode, backNum, pos, pHeight, pWeight, playerFlagCode2`

- `plan.md` 7장의 프로필 항목 중 **신장·등번호·포지션 확보**. 사진은 박스스코어의 `img`.
- **미해결: 프로 입단(드래프트) 정보.** `yearNo`가 null이며 `/draft/player/info`
  계열을 별도 확인해야 한다. 프로필의 부가 항목이므로 V1 차단 요소는 아니다.
- 응답 `totalCn=2049`로 시즌 필터가 적용되지 않는 듯하다. 역대 전체 선수로 보이며
  시즌별 로스터는 `records/player/entry` 또는 기록 API 조인으로 좁혀야 한다.

## 9. 최종 정리 — plan.md 요구사항 대비 데이터 확보 현황

| plan.md 항목 | 상태 | 소스 |
| --- | --- | --- |
| 선수 목록 / 검색 / 필터 | ✅ | `records/player/general/traditional` + `players` |
| Basic Stat | ✅ | `traditional` |
| Advanced Stat 7종 | ✅ (재계산 권장) | `general/advanced` + 박스스코어 |
| League Percentile | ✅ (자격 기준 필수) | 위 데이터로 자체 계산 |
| 선수 상세 프로필 | ⚠️ 입단 정보만 미해결 | `players` |
| 시즌별 커리어 추이 | ✅ | seasonCode 1~49 순회 |
| 최근 10경기 | ✅ | `match/list` + `player-stat` |
| 시즌 순위 | ✅ | `records/team/general/traditional` |
| 경기 일정 / 결과 | ✅ | `match/list` |
| Elo 예상 승률 | ✅ | 과거 경기 결과 + 2026-27 예정 경기 |
| (보너스) 슛 차트 | ✅ | `match-chart` |
| (보너스) 쿼터별 득점 추이 | ✅ | `match-chart` |
| (보너스) 라인업/클러치/허슬 | ✅ | `records/lineup/*`, `clutch/*`, `hustle` |

**결론: V1 전 기능의 데이터가 확보된다. 착수 가능.**
