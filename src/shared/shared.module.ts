import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './services/s3.service';
import { EventEmitterService } from './services/event-emitter.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3Service, EventEmitterService],
  exports: [S3Service, EventEmitterService],
})
export class SharedModule {}




