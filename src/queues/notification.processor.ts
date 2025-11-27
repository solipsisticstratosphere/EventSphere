import { Worker } from 'bullmq';
import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { TicketPurchasedData } from './notification.queue';
import { EventsGateway } from '../websockets/events.gateway';

@Injectable()
export class NotificationProcessor implements OnModuleInit, OnModuleDestroy {
  private worker: Worker;

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
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async handleTicketPurchased(data: TicketPurchasedData) {
    console.log('='.repeat(50));
    console.log('EMAIL NOTIFICATION');
    console.log('='.repeat(50));
    console.log(`To: ${data.userEmail}`);
    console.log(`Subject: Ticket Confirmation - ${data.eventTitle}`);
    console.log('_____________________________');
    console.log(`Dear ${data.userName},`);
    console.log('_____________________________');
    console.log(`Your ticket has been successfully purchased!`);
    console.log('_____________________________');
    console.log(`Event: ${data.eventTitle}`);
    console.log(`Date: ${new Date(data.eventDate).toLocaleString()}`);
    console.log(`Ticket ID: ${data.ticketId}`);
    console.log('_____________________________');
    console.log('Thank you for your purchase');
    console.log('='.repeat(50));

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
