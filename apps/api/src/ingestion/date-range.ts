/** "YYYYMMDD" 문자열 사이의 날짜 목록을 만드는 순수 함수. KBL 호출도 DB도 모른다. */

const YYYYMMDD = /^\d{8}$/;

function parseYyyymmdd(value: string): Date {
  if (!YYYYMMDD.test(value)) {
    throw new Error(`invalid date "${value}", expected YYYYMMDD`);
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  // UTC 기준 순수 달력 계산. 시간대 보정은 필요 없다 (KBL API도 "YYYYMMDD" 문자열만 받는다).
  return new Date(Date.UTC(year, month - 1, day));
}

function formatYyyymmdd(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/** from 부터 to 까지(양끝 포함) "YYYYMMDD" 문자열 배열. from > to 면 에러. */
export function enumerateDates(from: string, to: string): string[] {
  const start = parseYyyymmdd(from);
  const end = parseYyyymmdd(to);
  if (start.getTime() > end.getTime()) {
    throw new Error(`"from" (${from}) is after "to" (${to})`);
  }

  const dates: string[] = [];
  const oneDayMs = 24 * 60 * 60 * 1000;
  for (let t = start.getTime(); t <= end.getTime(); t += oneDayMs) {
    dates.push(formatYyyymmdd(new Date(t)));
  }
  return dates;
}
