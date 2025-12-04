import { Injectable, Inject } from "@nestjs/common";
import {
  TicketRepository,
  TicketCreateData,
  EventRepository,
} from "../../domain/repositories/ticket.repository.interface";
import { PaymentService } from "../../domain/services/payment.service.interface";
import { Ticket } from "../../domain/entities/ticket.entity";
import {
  TicketEventNotFoundError,
  TicketEventAlreadyPastError,
  TicketAlreadyExistsError,
  PaymentFailedError,
} from "../../domain/errors/ticket.errors";
import {
  TICKET_REPOSITORY,
  TICKET_EVENT_REPOSITORY,
  PAYMENT_SERVICE,
} from "../../tickets.tokens";
import { TicketStatus } from "@prisma/client";
import { EventEmitterService, TicketPaidEvent } from "../../../../shared";

@Injectable()
export class PurchaseTicketUseCase {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly ticketRepository: TicketRepository,
    @Inject(TICKET_EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
    @Inject(PAYMENT_SERVICE) private readonly paymentService: PaymentService,
    private readonly eventEmitter: EventEmitterService
  ) {}

  async execute(
    userId: string,
    eventId: string
  ): Promise<{ success: boolean; message: string; ticket: Ticket }> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new TicketEventNotFoundError(eventId);
    }

    if (new Date(event.date) < new Date()) {
      throw new TicketEventAlreadyPastError();
    }

    const existingTicket = await this.ticketRepository.findByUserAndEvent(
      userId,
      eventId
    );
    if (existingTicket) {
      throw new TicketAlreadyExistsError();
    }

    const ticketData: TicketCreateData = {
      eventId,
      userId,
      status: TicketStatus.PENDING,
    };
    const ticket = await this.ticketRepository.create(ticketData);

    try {
      const paymentResult = await this.paymentService.processPayment();

      if (paymentResult.success) {
        const paidTicket = await this.ticketRepository.update(ticket.id, {
          status: TicketStatus.PAID,
        });

        const ticketPaidEvent: TicketPaidEvent = {
          userEmail: event.user?.email || "",
          eventTitle: event.title,
          ticketId: paidTicket.id,
          userName: event.user?.name,
          eventDate: event.date instanceof Date ? event.date.toISOString() : event.date,
        };
        this.eventEmitter.emit('ticket.paid', ticketPaidEvent);

        return {
          success: true,
          message: paymentResult.message,
          ticket: paidTicket,
        };
      } else {
        await this.ticketRepository.update(ticket.id, {
          status: TicketStatus.FAILED,
        });

        throw new PaymentFailedError(paymentResult.message);
      }
    } catch (error) {
      if (ticket.status === "PENDING") {
        await this.ticketRepository.delete(ticket.id);
      }
      throw error;
    }
  }
}
