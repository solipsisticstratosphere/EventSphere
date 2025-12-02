import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({})
export class CoreConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: CoreConfigModule,
      imports: [
        NestConfigModule.forRoot({
          isGlobal: true,
        }),
        CacheModule.registerAsync({
          isGlobal: true,
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            store: redisStore,
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            ttl: 30,
          }),
        }),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 20,
          },
        ]),
      ],
      exports: [NestConfigModule, CacheModule, ThrottlerModule],
    };
  }
}




