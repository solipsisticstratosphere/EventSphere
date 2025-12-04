import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CoreConfigModule } from './config/core-config.module';
import { AppLogger } from './logger/logger.service';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ValidationPipe } from './pipes/validation.pipe';
import { CacheModule } from './cache/cache.module';

@Global()
@Module({
  imports: [CoreConfigModule.forRoot(), CacheModule],
  providers: [
    AppLogger,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  exports: [AppLogger, CoreConfigModule, CacheModule],
})
export class CoreModule {}

