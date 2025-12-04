import { Module } from "@nestjs/common";
import { EventsController } from "./infrastructure/controllers/events.controller";
import { PrismaEventRepository } from "./infrastructure/repositories/prisma-event.repository";
import { EventRepository } from "./domain/repositories/event.repository.interface";
import { CreateEventUseCase } from "./application/use-cases/create-event.use-case";
import { GetEventUseCase } from "./application/use-cases/get-event.use-case";
import { ListEventsUseCase } from "./application/use-cases/list-events.use-case";
import { UpdateEventUseCase } from "./application/use-cases/update-event.use-case";
import { DeleteEventUseCase } from "./application/use-cases/delete-event.use-case";
import { UploadEventImagesUseCase } from "./application/use-cases/upload-event-images.use-case";
import { DeleteEventImageUseCase } from "./application/use-cases/delete-event-image.use-case";
import { CancelEventUseCase } from "./application/use-cases/cancel-event.use-case";
import { S3FileAdapter } from "./infrastructure/adapters/s3-file-adapter";
import {
  FileDeleteService,
  FILE_DELETE_SERVICE,
} from "./application/use-cases/delete-event-image.use-case";
import {
  FileUploadService,
  FILE_UPLOAD_SERVICE,
} from "./application/use-cases/upload-event-images.use-case";
import { PrismaModule } from "../../prisma/prisma.module";
import { EventOwnershipGuard } from "../../auth/guards/event-ownership.guard";
import { EVENT_REPOSITORY } from "./events.tokens";
import { PrismaTicketRepository } from "../tickets/infrastructure/repositories/prisma-ticket.repository";
import { TICKET_REPOSITORY } from "../tickets/tickets.tokens";

@Module({
  imports: [PrismaModule],
  controllers: [EventsController],
  providers: [
    {
      provide: EVENT_REPOSITORY,
      useClass: PrismaEventRepository,
    },
    {
      provide: TICKET_REPOSITORY,
      useClass: PrismaTicketRepository,
    },
    {
      provide: FILE_DELETE_SERVICE,
      useClass: S3FileAdapter,
    },
    {
      provide: FILE_UPLOAD_SERVICE,
      useClass: S3FileAdapter,
    },
    CreateEventUseCase,
    GetEventUseCase,
    ListEventsUseCase,
    UpdateEventUseCase,
    DeleteEventUseCase,
    UploadEventImagesUseCase,
    DeleteEventImageUseCase,
    CancelEventUseCase,
    EventOwnershipGuard,
  ],
  exports: [EVENT_REPOSITORY, GetEventUseCase, EventOwnershipGuard],
})
export class EventsModule {}
