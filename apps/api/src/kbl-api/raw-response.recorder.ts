import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { IngestionRunContext } from '../run-context/ingestion-run.context.js';

export interface RawResponseInput {
  source: string;
  endpoint: string;
  params: Record<string, unknown>;
  statusCode: number;
  payload: unknown;
}

/** KBL API 응답 1건을 RawApiResponse 1행으로 남긴다. 성공/실패 모두 저장한다. */
@Injectable()
export class RawResponseRecorder {
  private readonly logger = new Logger(RawResponseRecorder.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly runContext: IngestionRunContext,
  ) {}

  async record(input: RawResponseInput): Promise<void> {
    try {
      await this.prisma.rawApiResponse.create({
        data: {
          source: input.source,
          endpoint: input.endpoint,
          params: toJson(input.params),
          statusCode: input.statusCode,
          payload: toJson(input.payload),
          ingestionRunId: this.runContext.runId,
        },
      });
    } catch (error) {
      // 원본 적재 실패가 수집 자체를 막지는 않도록 로그만 남긴다.
      this.logger.error(
        `RawApiResponse persist failed for ${input.endpoint}: ${(error as Error).message}`,
      );
    }
  }
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return (value ?? {}) as Prisma.InputJsonValue;
}
