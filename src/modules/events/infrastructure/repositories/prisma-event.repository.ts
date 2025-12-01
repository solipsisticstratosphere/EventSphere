import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EventRepository, EventFilters, PaginationOptions, PaginatedResult, EventCreateData, EventUpdateData } from '../../domain/repositories/event.repository.interface';
import { Event } from '../../domain/entities/event.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(eventData: EventCreateData): Promise<Event> {
    const created = await this.prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        location: eventData.location,
        price: eventData.price,
        userId: eventData.userId,
        image: eventData.image,
        images: eventData.images,
        thumbnailUrl: eventData.thumbnailUrl,
        category: eventData.category,
        status: eventData.status,
      },
    });

    return Event.fromPrisma(created);
  }

  async findById(id: string): Promise<Event | null> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    return event ? Event.fromPrisma(event) : null;
  }

  async findAll(filters: EventFilters, pagination: PaginationOptions): Promise<PaginatedResult<Event>> {
    const where: Prisma.EventWhereInput = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.date.lte = filters.dateTo;
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: {
          [pagination.sortBy || 'createdAt']: pagination.sortOrder || 'desc',
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: data.map(event => Event.fromPrisma(event)),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async update(id: string, data: EventUpdateData): Promise<Event> {
    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date !== undefined && { date: data.date }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.images !== undefined && { images: data.images }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: data.thumbnailUrl }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    return Event.fromPrisma(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.event.delete({
      where: { id },
    });
  }

  async updateImages(eventId: string, images: string[]): Promise<Event> {
    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        images: {
          set: images,
        },
      },
    });

    return Event.fromPrisma(updated);
  }
}

