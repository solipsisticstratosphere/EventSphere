import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from './cache.service';
import { CACHE_KEY_METADATA } from '../../shared/decorators/cache-key.decorator';
import { CACHE_TTL_METADATA } from '../../shared/decorators/cache-ttl.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const key = this.generateCacheKey(cacheKey, request);

    const cachedResponse = await this.cacheService.get(key);

    if (cachedResponse !== null) {
      this.logger.log(`Returning cached response for key: ${key}`);
      return of(cachedResponse);
    }

    const ttl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(key, response, ttl);
        this.logger.log(`Cached response for key: ${key}`);
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const queryParams = request.query || {};
    const userId = request.user?.id;

    const parts = [baseKey];

    const sortedQueryKeys = Object.keys(queryParams).sort();
    if (sortedQueryKeys.length > 0) {
      const queryString = sortedQueryKeys
        .map((k) => `${k}=${queryParams[k]}`)
        .join('&');
      parts.push(queryString);
    }

    if (userId) {
      parts.push(`user:${userId}`);
    }

    return parts.join(':');
  }
}
