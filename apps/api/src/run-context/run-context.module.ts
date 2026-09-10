import { Global, Module } from '@nestjs/common';
import { IngestionRunContext } from './ingestion-run.context.js';

/** IngestionRunContext 는 KblApiModule 과 IngestionModule 양쪽에서 필요하므로 전역으로 제공한다. */
@Global()
@Module({
  providers: [IngestionRunContext],
  exports: [IngestionRunContext],
})
export class RunContextModule {}
