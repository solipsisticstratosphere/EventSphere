import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { SocketEventsService } from './services/socket-events.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [JwtModule, ConfigModule],
  providers: [EventsGateway, SocketEventsService, WsJwtGuard],
  exports: [EventsGateway, SocketEventsService],
})
export class WebsocketsModule {}
