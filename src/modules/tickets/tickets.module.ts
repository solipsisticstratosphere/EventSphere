import { Module } from '@nestjs/common';
import { TicketsController } from './infrastructure/controllers/tickets.controller';
import { PrismaTicketRepository, PrismaEventRepositoryAdapter } from './infrastructure/repositories/prisma-ticket.repository';
import { TicketRepository, EventRepository } from './domain/repositories/ticket.repository.interface';
import { PaymentService } from './domain/services/payment.service.interface';
import { NotificationService } from './domain/services/notification.service.interface';
import { SimulatedPaymentService } from './infrastructure/services/payment.service';
import { NotificationQueueAdapter } from './infrastructure/services/notification-queue-adapter';
import { PurchaseTicketUseCase } from './application/use-cases/purchase-ticket.use-case';
import { CreateTicketUseCase } from './application/use-cases/create-ticket.use-case';
import { GetTicketUseCase } from './application/use-cases/get-ticket.use-case';
import { ListTicketsUseCase } from './application/use-cases/list-tickets.use-case';
import { GetUserTicketsUseCase } from './application/use-cases/get-user-tickets.use-case';
import { UpdateTicketUseCase } from './application/use-cases/update-ticket.use-case';
import { DeleteTicketUseCase } from './application/use-cases/delete-ticket.use-case';
import { PrismaModule } from '../../prisma/prisma.module';
import { QueuesModule } from '../../queues/queues.module';
import { TICKET_REPOSITORY, TICKET_EVENT_REPOSITORY, PAYMENT_SERVICE, NOTIFICATION_SERVICE } from './tickets.tokens';

@Module({
  imports: [PrismaModule, QueuesModule],
  controllers: [TicketsController],
  providers: [
    {
      provide: TICKET_REPOSITORY,
      useClass: PrismaTicketRepository,
    },
    {
      provide: TICKET_EVENT_REPOSITORY,
      useClass: PrismaEventRepositoryAdapter,
    },
    {
      provide: PAYMENT_SERVICE,
      useClass: SimulatedPaymentService,
    },
    {
      provide: NOTIFICATION_SERVICE,
      useClass: NotificationQueueAdapter,
    },
    PurchaseTicketUseCase,
    CreateTicketUseCase,
    GetTicketUseCase,
    ListTicketsUseCase,
    GetUserTicketsUseCase,
    UpdateTicketUseCase,
    DeleteTicketUseCase,
  ],
  exports: [TICKET_REPOSITORY],
})
export class TicketsModule {}

