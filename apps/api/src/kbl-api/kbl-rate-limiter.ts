import { Inject, Injectable } from '@nestjs/common';
import { KBL_API_CONFIG, type KblApiConfig } from './kbl-api.config.js';

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 모든 KBL 요청을 하나의 큐로 직렬화하고, 각 요청 뒤에 최소 간격을 둔다.
 * (spike 의 `await sleep(300)` 에 대응 — 다만 3개 클라이언트가 공유한다.)
 */
@Injectable()
export class KblRateLimiter {
  private tail: Promise<unknown> = Promise.resolve();
  private readonly intervalMs: number;

  constructor(@Inject(KBL_API_CONFIG) config: KblApiConfig) {
    this.intervalMs = config.minRequestIntervalMs;
  }

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const result = this.tail.then(async () => {
      try {
        return await task();
      } finally {
        await delay(this.intervalMs);
      }
    });
    // 체인은 성공/실패와 무관하게 이어져야 한다 (에러는 호출자에게만 전달).
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
