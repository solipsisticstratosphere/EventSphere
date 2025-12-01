import { Injectable, Inject } from "@nestjs/common";
import { EventRepository } from "../../domain/repositories/event.repository.interface";
import { Event } from "../../domain/entities/event.entity";
import { EventNotFoundError } from "../../domain/errors/event.errors";
import {
  NoFilesUploadedError,
  FileTooLargeError,
  InvalidFileTypeError,
} from "../../domain/errors/file-validation.errors";
import { EVENT_REPOSITORY } from "../../events.tokens";

export interface FileUploadService {
  uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string
  ): Promise<string[]>;
}

export const FILE_UPLOAD_SERVICE = "FileUploadService";

@Injectable()
export class UploadEventImagesUseCase {
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
  ];

  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository,
    @Inject(FILE_UPLOAD_SERVICE)
    private readonly fileUploadService: FileUploadService
  ) {}

  async execute(eventId: string, files: Express.Multer.File[]): Promise<Event> {
    this.validateFiles(files);

    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundError(eventId);
    }

    const uploadedUrls = await this.fileUploadService.uploadMultipleFiles(
      files,
      "events"
    );

    const updatedImages = [...event.images, ...uploadedUrls];
    return this.eventRepository.updateImages(eventId, updatedImages);
  }

  private validateFiles(files: Express.Multer.File[]): void {
    if (!files || files.length === 0) {
      throw new NoFilesUploadedError();
    }

    for (const file of files) {
      if (file.size > this.maxFileSize) {
        throw new FileTooLargeError(file.originalname, this.maxFileSize);
      }

      if (!this.allowedTypes.includes(file.mimetype)) {
        throw new InvalidFileTypeError(file.originalname, this.allowedTypes);
      }
    }
  }
}
