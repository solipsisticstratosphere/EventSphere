import { Module } from '@nestjs/common';
import { NotificationQueue } from './notification.queue';
import { NotificationProcessor } from './notification.processor';

@Module({
  providers: [NotificationQueue, NotificationProcessor],
  exports: [NotificationQueue],
})
export class QueuesModule {}
