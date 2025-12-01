import { Injectable, Inject } from "@nestjs/common";
import { EventRepository } from "../../domain/repositories/event.repository.interface";
import { Event } from "../../domain/entities/event.entity";
import {
  EventNotFoundError,
  ImageNotFoundError,
} from "../../domain/errors/event.errors";
import { EVENT_REPOSITORY } from "../../events.tokens";

export interface FileDeleteService {
  deleteFile(url: string): Promise<void>;
  deleteMultipleFiles?(urls: string[]): Promise<void>;
}

export const FILE_DELETE_SERVICE = "FileDeleteService";

@Injectable()
export class DeleteEventImageUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
    @Inject(FILE_DELETE_SERVICE)
    private readonly fileDeleteService: FileDeleteService
  ) {}

  async execute(eventId: string, imageUrl: string): Promise<Event> {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    if (!event.images.includes(imageUrl)) {
      throw new ImageNotFoundError();
    }

    await this.fileDeleteService.deleteFile(imageUrl);

    const updatedImages = event.images.filter((url) => url !== imageUrl);
    return this.eventRepository.updateImages(eventId, updatedImages);
  }
}
