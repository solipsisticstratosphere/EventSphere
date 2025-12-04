import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;
  private readonly defaultTTL: number;

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.defaultTTL = this.configService.get<number>('CACHE_TTL', 300);

    this.redis.on('connect', () => {
      this.logger.log('Redis client connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);

      if (value) {
        this.logger.debug(`Cache HIT for key: ${key}`);
        return JSON.parse(value) as T;
      }

      this.logger.debug(`Cache MISS for key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const ttlToUse = ttl ?? this.defaultTTL;
      await this.redis.setex(key, ttlToUse, JSON.stringify(value));
      this.logger.debug(`Cache SET for key: ${key} with TTL: ${ttlToUse}s`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      await this.redis.del(...keys);
      this.logger.debug(`Cache DELETED for keys: ${keys.join(', ')}`);
    } catch (error) {
      this.logger.error(`Error deleting cache keys:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.debug(`Cache DELETED ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  }

  async wrap<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const result = await factory();
    await this.set(key, result, ttl);

    return result;
  }

  async reset(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.warn('Cache RESET - All keys deleted');
    } catch (error) {
      this.logger.error('Error resetting cache:', error);
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}
