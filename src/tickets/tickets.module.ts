import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PaymentService } from './services/payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [TicketsController],
  providers: [TicketsService, PaymentService],
  exports: [TicketsService],
})
export class TicketsModule {}
