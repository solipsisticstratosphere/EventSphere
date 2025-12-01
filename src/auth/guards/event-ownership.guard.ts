import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { EventRepository } from '../../modules/events/domain/repositories/event.repository.interface';
import { EVENT_REPOSITORY } from '../../modules/events/events.tokens';
import { Role } from '@prisma/client';

@Injectable()
export class EventOwnershipGuard implements CanActivate {
  constructor(
    @Inject(EVENT_REPOSITORY) private eventRepository: EventRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const eventId = request.params.id;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this event');
    }

    return true;
  }
}
