import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

interface RunStore {
  runId: number;
}

/**
 * 한 번의 ingestion 실행(IngestionRun) 동안 runId 를 흘려보내는 컨텍스트.
 *
 * KBL API 클라이언트의 메서드 시그니처를 깨끗하게 유지하려고(runId 를 인자로 넘기지 않으려고)
 * AsyncLocalStorage 를 쓴다. RawResponseRecorder 가 응답을 저장할 때 이 값을 읽어
 * RawApiResponse.ingestionRunId 를 채운다. 컨텍스트 밖(클라이언트 단독 호출)이면 null.
 */
@Injectable()
export class IngestionRunContext {
  private readonly storage = new AsyncLocalStorage<RunStore>();

  run<T>(runId: number, fn: () => Promise<T>): Promise<T> {
    return this.storage.run({ runId }, fn);
  }

  get runId(): number | null {
    return this.storage.getStore()?.runId ?? null;
  }
}
