import { Queue } from 'bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';

export interface TicketPurchasedData {
  userEmail: string;
  userName: string;
  eventTitle: string;
  eventDate: Date;
  ticketId: string;
}

@Injectable()
export class NotificationQueue implements OnModuleInit {
  private queue: Queue;

  async onModuleInit() {
    this.queue = new Queue('notifications', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
  }

  async addTicketPurchasedNotification(data: TicketPurchasedData) {
    return this.queue.add('ticket-purchased', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}
