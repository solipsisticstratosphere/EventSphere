import { Injectable } from '@nestjs/common';
import { NotificationQueue } from '../../../../queues/notification.queue';
import {
  NotificationService,
  TicketPurchasedNotification,
} from '../../domain/services/notification.service.interface';

@Injectable()
export class NotificationQueueAdapter implements NotificationService {
  constructor(private readonly notificationQueue: NotificationQueue) {}

  async sendTicketPurchasedNotification(
    data: TicketPurchasedNotification
  ): Promise<void> {
    await this.notificationQueue.addTicketPurchasedNotification({
      ...data,
      eventDate: data.eventDate instanceof Date ? data.eventDate : new Date(data.eventDate),
    });
  }
}

