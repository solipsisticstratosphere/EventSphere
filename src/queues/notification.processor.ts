import { Worker } from 'bullmq';
import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef, Logger } from '@nestjs/common';
import { TicketPurchasedData } from './notification.queue';
import { EventsGateway } from '../websockets/events.gateway';

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async onModuleInit() {
    this.worker = new Worker(
      'notifications',
      async (job) => {
        if (job.name === 'ticket-purchased') {
          await this.handleTicketPurchased(job.data);
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed`, err);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async handleTicketPurchased(data: TicketPurchasedData) {
    const emailContent = [
      '='.repeat(50),
      'EMAIL NOTIFICATION',
      '='.repeat(50),
      `To: ${data.userEmail}`,
      `Subject: Ticket Confirmation - ${data.eventTitle}`,
      '_____________________________',
      `Dear ${data.userName},`,
      '_____________________________',
      'Your ticket has been successfully purchased!',
      '_____________________________',
      `Event: ${data.eventTitle}`,
      `Date: ${new Date(data.eventDate).toLocaleString()}`,
      `Ticket ID: ${data.ticketId}`,
      '_____________________________',
      'Thank you for your purchase',
      '='.repeat(50),
    ].join('\n');

    this.logger.log(emailContent);

    await this.eventsGateway.emitTicketPurchased(
      data.eventId,
      data.userId,
      {
        ticketId: data.ticketId,
        eventTitle: data.eventTitle,
        eventDate: data.eventDate,
        userName: data.userName,
      },
    );
  }
}
