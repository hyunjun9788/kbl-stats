/** KBL API 가 non-2xx 를 반환했을 때 던진다. 어느 소스/엔드포인트/파라미터에서 실패했는지 담는다. */
export class KblApiError extends Error {
  constructor(
    readonly source: string,
    readonly endpoint: string,
    readonly params: Record<string, unknown>,
    readonly status: number,
    readonly bodyExcerpt = '',
  ) {
    super(`KBL API [${source}] ${endpoint} -> HTTP ${status}`);
    this.name = 'KblApiError';
  }
}
