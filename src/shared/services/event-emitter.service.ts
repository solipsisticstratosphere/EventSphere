import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

@Injectable()
export class EventEmitterService implements OnModuleInit {
  private client: ClientProxy;
  private readonly logger = new Logger(EventEmitterService.name);

  async onModuleInit() {
    this.client = ClientProxyFactory.create({
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    });

    await this.client.connect();
    this.logger.log('Connected to Redis for event publishing');
  }

  emit<T = any>(pattern: string, data: T): void {
    this.logger.log(`Emitting event: ${pattern}`);
    this.client.emit(pattern, data);
  }

  async emitAsync<T = any>(pattern: string, data: T): Promise<void> {
    this.logger.log(`Emitting event (async): ${pattern}`);
    return new Promise((resolve) => {
      this.client.emit(pattern, data);
      resolve();
    });
  }
}
