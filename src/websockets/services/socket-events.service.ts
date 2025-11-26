import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class SocketEventsService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async addOnlineUser(userId: string): Promise<void> {
    await this.redis.sadd('online_users', userId);
  }

  async removeOnlineUser(userId: string): Promise<void> {
    await this.redis.srem('online_users', userId);
  }

  async getOnlineUsersCount(): Promise<number> {
    return await this.redis.scard('online_users');
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return (await this.redis.sismember('online_users', userId)) === 1;
  }

  async addEventViewer(eventId: string, userId: string): Promise<void> {
    await this.redis.sadd(`event_viewers:${eventId}`, userId);
  }

  async removeEventViewer(eventId: string, userId: string): Promise<void> {
    await this.redis.srem(`event_viewers:${eventId}`, userId);
  }

  async getEventViewersCount(eventId: string): Promise<number> {
    return await this.redis.scard(`event_viewers:${eventId}`);
  }

  async getEventViewers(eventId: string): Promise<string[]> {
    return await this.redis.smembers(`event_viewers:${eventId}`);
  }

  
  async removeUserFromAllEvents(userId: string): Promise<void> {
    const keys = await this.redis.keys('event_viewers:*');
    const pipeline = this.redis.pipeline();

    for (const key of keys) {
      pipeline.srem(key, userId);
    }

    await pipeline.exec();
  }

  async getUserViewingEvents(userId: string): Promise<string[]> {
    const keys = await this.redis.keys('event_viewers:*');
    const viewingEvents: string[] = [];

    for (const key of keys) {
      const isMember = await this.redis.sismember(key, userId);
      if (isMember === 1) {
        const eventId = key.replace('event_viewers:', '');
        viewingEvents.push(eventId);
      }
    }

    return viewingEvents;
  }
}
