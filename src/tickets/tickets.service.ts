import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createTicketDto: CreateTicketDto) {
    return this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        userId,
      },
    });
  }

  async findAll() {
    return this.prisma.ticket.findMany({
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        event: true,
        user: true,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
  }

  async update(id: string, updateTicketDto: UpdateTicketDto) {
    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
    });
  }

  async remove(id: string) {
    return this.prisma.ticket.delete({
      where: { id },
    });
  }
}
