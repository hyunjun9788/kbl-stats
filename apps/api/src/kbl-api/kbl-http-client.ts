import { Logger } from '@nestjs/common';
import { KblApiError } from './kbl-api.error.js';
import { KblRateLimiter } from './kbl-rate-limiter.js';
import { RawResponseRecorder } from './raw-response.recorder.js';

export type KblSource = 'meta' | 'stats' | 'game';

export interface KblClientDeps {
  rateLimiter: KblRateLimiter;
  recorder: RawResponseRecorder;
  userAgent: string;
}

type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * KBL API 3개 호스트의 공통 HTTP 동작.
 *   - 기본 헤더 병합 (호스트마다 필수 헤더가 다르다 — spike 참고)
 *   - rate limit (KblRateLimiter 공유 큐)
 *   - 응답 원본을 RawApiResponse 로 적재 (성공/실패 모두)
 *   - non-2xx 는 KblApiError 로 변환
 *
 * 도메인/Prisma 는 전혀 모른다. "JSON 을 어떻게 가져오는가" 까지가 책임.
 */
export abstract class KblHttpClient {
  protected readonly logger = new Logger(this.constructor.name);

  protected constructor(
    private readonly deps: KblClientDeps,
    protected readonly source: KblSource,
    protected readonly baseUrl: string,
    protected readonly defaultHeaders: Record<string, string>,
  ) {}

  protected async get<T>(endpoint: string, params: QueryParams = {}): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const cleanedParams = cleanParams(params);

    const { status, payload } = await this.deps.rateLimiter.schedule(async () => {
      this.logger.debug(`GET ${url}`);
      const res = await fetch(url, {
        headers: { 'User-Agent': this.deps.userAgent, ...this.defaultHeaders },
      });
      const text = await res.text();
      return { status: res.status, payload: safeJsonParse(text) };
    });

    await this.deps.recorder.record({
      source: this.source,
      endpoint,
      params: cleanedParams,
      statusCode: status,
      payload,
    });

    if (status < 200 || status >= 300) {
      throw new KblApiError(
        this.source,
        endpoint,
        cleanedParams,
        status,
        excerpt(payload),
      );
    }
    return payload as T;
  }

  private buildUrl(endpoint: string, params: QueryParams): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        search.set(key, String(value));
      }
    }
    const qs = search.toString();
    return `${this.baseUrl}${endpoint}${qs ? `?${qs}` : ''}`;
  }
}

function safeJsonParse(text: string): unknown {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { _unparsed: text.slice(0, 2000) };
  }
}

function cleanParams(
  params: QueryParams,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean>;
}

function excerpt(payload: unknown): string {
  try {
    return JSON.stringify(payload).slice(0, 500);
  } catch {
    return String(payload).slice(0, 500);
  }
}
