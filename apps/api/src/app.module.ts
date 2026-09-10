import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { KblApiModule } from './kbl-api/kbl-api.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RunContextModule } from './run-context/run-context.module.js';

@Module({
  imports: [
    PrismaModule,
    RunContextModule,
    KblApiModule,
    IngestionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
