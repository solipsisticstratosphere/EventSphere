import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { ThrottlerGuard } from "@nestjs/throttler";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../../auth/guards/roles.guard";
import { EventOwnershipGuard } from "../../../../auth/guards/event-ownership.guard";
import { Roles } from "../../../../auth/decorators/roles.decorator";
import { CacheTTL } from "../../../../shared/decorators";
import { Role } from "@prisma/client";
import { CreateEventDto } from "../../application/dto/create-event.dto";
import { UpdateEventDto } from "../../application/dto/update-event.dto";
import { QueryEventDto } from "../../application/dto/query-event.dto";
import { CreateEventUseCase } from "../../application/use-cases/create-event.use-case";
import { GetEventUseCase } from "../../application/use-cases/get-event.use-case";
import { ListEventsUseCase } from "../../application/use-cases/list-events.use-case";
import { UpdateEventUseCase } from "../../application/use-cases/update-event.use-case";
import { DeleteEventUseCase } from "../../application/use-cases/delete-event.use-case";
import { UploadEventImagesUseCase } from "../../application/use-cases/upload-event-images.use-case";
import { DeleteEventImageUseCase } from "../../application/use-cases/delete-event-image.use-case";
import { CancelEventUseCase } from "../../application/use-cases/cancel-event.use-case";
import {
  EventNotFoundError,
  ImageNotFoundError,
  EventAlreadyCancelledError,
  CannotCancelPastEventError,
} from "../../domain/errors/event.errors";
import { NotFoundException } from "@nestjs/common";

@ApiTags("events")
@Controller("events")
@UseGuards(ThrottlerGuard)
export class EventsController {
  constructor(
    private readonly createEventUseCase: CreateEventUseCase,
    private readonly getEventUseCase: GetEventUseCase,
    private readonly listEventsUseCase: ListEventsUseCase,
    private readonly updateEventUseCase: UpdateEventUseCase,
    private readonly deleteEventUseCase: DeleteEventUseCase,
    private readonly uploadEventImagesUseCase: UploadEventImagesUseCase,
    private readonly deleteEventImageUseCase: DeleteEventImageUseCase,
    private readonly cancelEventUseCase: CancelEventUseCase
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new event" })
  @ApiResponse({ status: 201, description: "Event created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires ORGANIZER or ADMIN role",
  })
  async create(@Request() req, @Body() createEventDto: CreateEventDto) {
    const event = await this.createEventUseCase.execute(
      req.user.id,
      createEventDto
    );
    return this.mapEventToResponse(event);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30)
  @ApiOperation({ summary: "Get all events" })
  @ApiResponse({ status: 200, description: "Return all events" })
  async findAll(@Query() query: QueryEventDto) {
    const result = await this.listEventsUseCase.execute(query);
    return {
      data: result.data.map((event) => this.mapEventToResponse(event)),
      meta: result.meta,
    };
  }

  @Get(":id")
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiOperation({ summary: "Get event by id" })
  @ApiResponse({ status: 200, description: "Return event details" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async findOne(@Param("id") id: string) {
    try {
      const event = await this.getEventUseCase.execute(id);
      return this.mapEventToResponse(event);
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update event" })
  @ApiResponse({ status: 200, description: "Event updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - not event owner" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async update(
    @Param("id") id: string,
    @Body() updateEventDto: UpdateEventDto
  ) {
    try {
      const event = await this.updateEventUseCase.execute(id, updateEventDto);
      return this.mapEventToResponse(event);
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete event" })
  @ApiResponse({ status: 200, description: "Event deleted successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - not event owner" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async remove(@Param("id") id: string) {
    try {
      await this.deleteEventUseCase.execute(id);
      return { message: "Event deleted successfully" };
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post(":id/images")
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  @UseInterceptors(FilesInterceptor("images", 10))
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Upload event images" })
  @ApiResponse({ status: 201, description: "Images uploaded successfully" })
  @ApiResponse({ status: 400, description: "Bad request - invalid files" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async uploadImages(
    @Param("id") id: string,
    @UploadedFiles() files: Express.Multer.File[]
  ) {
    try {
      const event = await this.uploadEventImagesUseCase.execute(id, files);
      return this.mapEventToResponse(event);
    } catch (error) {
      if (
        error instanceof EventNotFoundError ||
        error.name === "NoFilesUploadedError" ||
        error.name === "FileTooLargeError" ||
        error.name === "InvalidFileTypeError"
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Delete(":id/images")
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete event image" })
  @ApiResponse({ status: 200, description: "Image deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad request - image URL required" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteImage(
    @Param("id") id: string,
    @Body("imageUrl") imageUrl: string
  ) {
    if (!imageUrl) {
      throw new BadRequestException("Image URL is required");
    }
    try {
      const event = await this.deleteEventImageUseCase.execute(id, imageUrl);
      return this.mapEventToResponse(event);
    } catch (error) {
      if (
        error instanceof EventNotFoundError ||
        error instanceof ImageNotFoundError
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post(":id/cancel")
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Cancel event" })
  @ApiResponse({ status: 200, description: "Event cancelled successfully" })
  @ApiResponse({
    status: 400,
    description: "Bad request - cannot cancel event",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Event not found" })
  async cancelEvent(@Param("id") id: string) {
    try {
      const event = await this.cancelEventUseCase.execute(id);
      return this.mapEventToResponse(event);
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (
        error instanceof EventAlreadyCancelledError ||
        error instanceof CannotCancelPastEventError
      ) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private mapEventToResponse(event: any) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      price: event.price,
      image: event.image,
      images: event.images,
      thumbnailUrl: event.thumbnailUrl,
      category: event.category,
      status: event.status,
      userId: event.userId,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }
}
