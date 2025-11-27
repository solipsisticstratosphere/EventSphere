import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { SocketEventsService } from './services/socket-events.service';

interface EventJoinPayload {
  eventId: string;
}

interface EventLeavePayload {
  eventId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(private readonly socketEventsService: SocketEventsService) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        this.logger.warn(`Connection rejected - no userId found`);
        client.disconnect();
        return;
      }

      this.logger.log(`Client connected: ${client.id}, User: ${userId}`);

      await this.socketEventsService.addOnlineUser(userId);

      await this.broadcastOnlineUsersUpdate();

      client.emit('connection:success', {
        message: 'Successfully connected to EventSphere',
        userId,
      });
    } catch (error) {
      this.logger.error(`Error in handleConnection: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        return;
      }

      this.logger.log(`client disconnected: ${client.id}, user: ${userId}`);

      const viewingEvents = await this.socketEventsService.getUserViewingEvents(
        userId,
      );

      for (const eventId of viewingEvents) {
        await this.socketEventsService.removeEventViewer(eventId, userId);
        await this.broadcastEventViewersUpdate(eventId);
      }

      await this.socketEventsService.removeOnlineUser(userId);

      await this.broadcastOnlineUsersUpdate();
    } catch (error) {
      this.logger.error(`Error in handleDisconnect: ${error.message}`);
    }
  }

  @SubscribeMessage('event:join')
  async handleEventJoin(
    @MessageBody() payload: EventJoinPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const { eventId } = payload;

      if (!eventId) {
        client.emit('error', { message: 'eventId is required' });
        return;
      }

      this.logger.log(`User ${userId} joined event ${eventId}`);

      await this.socketEventsService.addEventViewer(eventId, userId);

      client.join(`event:${eventId}`);

      await this.broadcastEventViewersUpdate(eventId);

      client.emit('event:joined', {
        eventId,
        message: 'Successfully joined event',
      });
    } catch (error) {
      this.logger.error(`Error in handleEventJoin: ${error.message}`);
      client.emit('error', { message: 'Failed to join event' });
    }
  }

  @SubscribeMessage('event:leave')
  async handleEventLeave(
    @MessageBody() payload: EventLeavePayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const { eventId } = payload;

      if (!eventId) {
        client.emit('error', { message: 'eventId is required' });
        return;
      }

      this.logger.log(`User ${userId} left event ${eventId}`);

      await this.socketEventsService.removeEventViewer(eventId, userId);

      client.leave(`event:${eventId}`);

      await this.broadcastEventViewersUpdate(eventId);

      client.emit('event:left', {
        eventId,
        message: 'Successfully left event',
      });
    } catch (error) {
      this.logger.error(`Error in handleEventLeave: ${error.message}`);
      client.emit('error', { message: 'Failed to leave event' });
    }
  }

  async emitTicketPurchased(
    eventId: string,
    userId: string,
    ticketData: {
      ticketId: string;
      eventTitle: string;
      eventDate: Date;
      userName: string;
    },
  ) {
    try {
      this.logger.log(
        `Emitting ticket purchased event for event ${eventId}, user ${userId}`,
      );

      this.server.to(`event:${eventId}`).emit('ticket:purchased', {
        eventId,
        userId,
        ticketId: ticketData.ticketId,
        eventTitle: ticketData.eventTitle,
        status: 'paid',
        timestamp: new Date(),
      });

      const userSockets = await this.getUserSockets(userId);
      for (const socket of userSockets) {
        socket.emit('ticket:purchase:success', {
          ticketId: ticketData.ticketId,
          eventTitle: ticketData.eventTitle,
          eventDate: ticketData.eventDate,
          message: 'Your ticket has been successfully purchased!',
        });
      }
    } catch (error) {
      this.logger.error(`Error in emitTicketPurchased: ${error.message}`);
    }
  }

  private async broadcastOnlineUsersUpdate() {
    try {
      const count = await this.socketEventsService.getOnlineUsersCount();
      this.server.emit('online:update', { count });
      this.logger.log(`Broadcasted online users update: ${count}`);
    } catch (error) {
      this.logger.error(
        `Error in broadcastOnlineUsersUpdate: ${error.message}`,
      );
    }
  }

  private async broadcastEventViewersUpdate(eventId: string) {
    try {
      const viewers = await this.socketEventsService.getEventViewersCount(
        eventId,
      );
      this.server.to(`event:${eventId}`).emit('event:view:update', {
        eventId,
        viewers,
      });
      this.logger.log(`Broadcasted event viewers update for ${eventId}: ${viewers}`);
    } catch (error) {
      this.logger.error(
        `Error in broadcastEventViewersUpdate: ${error.message}`,
      );
    }
  }

  private async getUserSockets(userId: string): Promise<Socket[]> {
    const sockets: Socket[] = [];
    const allSockets = await this.server.fetchSockets();

    for (const socket of allSockets) {
      if (socket.data.userId === userId) {
        sockets.push(socket as unknown as Socket);
      }
    }

    return sockets;
  }

  async getOnlineUsersCount(): Promise<number> {
    return await this.socketEventsService.getOnlineUsersCount();
  }

  async getEventViewersCount(eventId: string): Promise<number> {
    return await this.socketEventsService.getEventViewersCount(eventId);
  }
}
