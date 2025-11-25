import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { S3Module } from '../s3/s3.module';
import { PrismaModule } from '../prisma/prisma.module';
import { EventOwnershipGuard } from '../auth/guards/event-ownership.guard';

@Module({
  imports: [S3Module, PrismaModule],
  controllers: [EventsController],
  providers: [EventsService, EventOwnershipGuard],
  exports: [EventsService],
})
export class EventsModule {}
