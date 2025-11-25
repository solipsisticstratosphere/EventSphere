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
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EventOwnershipGuard } from '../auth/guards/event-ownership.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  create(@Request() req, @Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(req.user.id, createEventDto);
  }

  @Get()
  findAll(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

    for (const file of files) {
      if (file.size > maxSize) {
        throw new BadRequestException(`File ${file.originalname} is too large. Max size is 5MB`);
      }
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File ${file.originalname} has invalid type. Allowed types: jpeg, jpg, png, webp`,
        );
      }
    }

    return this.eventsService.uploadImages(id, files);
  }

  @Delete(':id/images')
  @UseGuards(JwtAuthGuard, EventOwnershipGuard)
  deleteImage(@Param('id') id: string, @Body('imageUrl') imageUrl: string) {
    if (!imageUrl) {
      throw new BadRequestException('Image URL is required');
    }
    return this.eventsService.deleteImage(id, imageUrl);
  }
}
