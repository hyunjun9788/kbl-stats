import { Module } from '@nestjs/common';
import { KblApiModule } from '../kbl-api/kbl-api.module.js';
import { IngestionRepository } from './ingestion.repository.js';
import { IngestionService } from './ingestion.service.js';

@Module({
  imports: [KblApiModule],
  providers: [IngestionRepository, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
