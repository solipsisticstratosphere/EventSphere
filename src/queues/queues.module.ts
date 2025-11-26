import { Module, forwardRef } from '@nestjs/common';
import { NotificationQueue } from './notification.queue';
import { NotificationProcessor } from './notification.processor';
import { WebsocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [forwardRef(() => WebsocketsModule)],
  providers: [NotificationQueue, NotificationProcessor],
  exports: [NotificationQueue],
})
export class QueuesModule {}
