import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        ...createNotificationDto,
        userId,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
