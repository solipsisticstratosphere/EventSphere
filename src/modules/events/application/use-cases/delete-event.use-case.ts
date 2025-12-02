import { Injectable, Inject, Optional } from "@nestjs/common";
import { EventRepository } from "../../domain/repositories/event.repository.interface";
import { EventNotFoundError } from "../../domain/errors/event.errors";
import {
  FileDeleteService,
  FILE_DELETE_SERVICE,
} from "./delete-event-image.use-case";
import { EVENT_REPOSITORY } from "../../events.tokens";

@Injectable()
export class DeleteEventUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
    @Optional()
    @Inject(FILE_DELETE_SERVICE)
    private readonly fileDeleteService?: FileDeleteService
  ) {}

  async execute(id: string): Promise<void> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new EventNotFoundError(id);
    }

    if (this.fileDeleteService) {
      if (
        event.images &&
        event.images.length > 0 &&
        this.fileDeleteService.deleteMultipleFiles
      ) {
        await this.fileDeleteService.deleteMultipleFiles(event.images);
      }
      if (event.image) {
        await this.fileDeleteService.deleteFile(event.image);
      }
    }

    await this.eventRepository.delete(id);
  }
}
