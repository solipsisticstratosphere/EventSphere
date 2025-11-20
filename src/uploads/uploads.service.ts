import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UploadsService {
  constructor(private prisma: PrismaService) {}

  async create(filename: string, url: string) {
    return this.prisma.upload.create({
      data: {
        filename,
        url,
      },
    });
  }

  async findAll() {
    return this.prisma.upload.findMany();
  }

  async findOne(id: string) {
    return this.prisma.upload.findUnique({
      where: { id },
    });
  }

  async remove(id: string) {
    return this.prisma.upload.delete({
      where: { id },
    });
  }
}
