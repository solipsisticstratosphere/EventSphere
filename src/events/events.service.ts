import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { S3Service } from '../s3/s3.service';
import { Prisma } from '@prisma/client';

export interface PaginatedEvents {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async create(userId: string, createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryEventDto): Promise<PaginatedEvents> {
    const { page = 1, limit = 10, search, category, location, dateFrom, dateTo, minPrice, maxPrice, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price.lte = maxPrice;
      }
    }

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        tickets: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.prisma.event.update({
      where: { id },
      data: updateEventDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (event.images && event.images.length > 0) {
      await this.s3Service.deleteMultipleFiles(event.images);
    }

    if (event.image) {
      await this.s3Service.deleteFile(event.image);
    }

    return this.prisma.event.delete({
      where: { id },
    });
  }

  async uploadImages(eventId: string, files: Express.Multer.File[]) {
    const event = await this.findOne(eventId);

    const uploadedUrls = await this.s3Service.uploadMultipleFiles(files, 'events');

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        images: {
          push: uploadedUrls,
        },
      },
    });
  }

  async deleteImage(eventId: string, imageUrl: string) {
    const event = await this.findOne(eventId);

    if (!event.images.includes(imageUrl)) {
      throw new NotFoundException('Image not found in event');
    }

    await this.s3Service.deleteFile(imageUrl);

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        images: {
          set: event.images.filter(url => url !== imageUrl),
        },
      },
    });
  }
}
