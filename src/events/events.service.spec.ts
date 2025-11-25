import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: PrismaService;
  let s3Service: S3Service;

  const mockPrismaService = {
    event: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockS3Service = {
    uploadFile: jest.fn(),
    uploadMultipleFiles: jest.fn(),
    deleteFile: jest.fn(),
    deleteMultipleFiles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get<PrismaService>(PrismaService);
    s3Service = module.get<S3Service>(S3Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const userId = 'user-123';
      const createEventDto: CreateEventDto = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2025-12-31T00:00:00Z',
        location: 'Test Location',
        price: 100,
      };

      const mockEvent = {
        id: 'event-123',
        ...createEventDto,
        userId,
        user: {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          role: 'ORGANIZER',
        },
      };

      mockPrismaService.event.create.mockResolvedValue(mockEvent);

      const result = await service.create(userId, createEventDto);

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.create).toHaveBeenCalledWith({
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
    });
  });

  describe('findAll', () => {
    it('should return paginated events', async () => {
      const query: QueryEventDto = {
        page: 1,
        limit: 10,
      };

      const mockEvents = [
        {
          id: 'event-1',
          title: 'Event 1',
          description: 'Description 1',
          date: new Date('2025-12-31'),
          location: 'Location 1',
          price: 100,
        },
      ];

      mockPrismaService.event.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.event.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: mockEvents,
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
      expect(mockPrismaService.event.findMany).toHaveBeenCalled();
      expect(mockPrismaService.event.count).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      const query: QueryEventDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should apply price filter', async () => {
      const query: QueryEventDto = {
        page: 1,
        limit: 10,
        minPrice: 50,
        maxPrice: 200,
      };

      mockPrismaService.event.findMany.mockResolvedValue([]);
      mockPrismaService.event.count.mockResolvedValue(0);

      await service.findAll(query);

      expect(mockPrismaService.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: {
              gte: 50,
              lte: 200,
            },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        title: 'Test Event',
        description: 'Test Description',
        date: new Date('2025-12-31'),
        location: 'Test Location',
        price: 100,
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne(eventId);

      expect(result).toEqual(mockEvent);
      expect(mockPrismaService.event.findUnique).toHaveBeenCalledWith({
        where: { id: eventId },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      const eventId = 'non-existent';
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.findOne(eventId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const eventId = 'event-123';
      const updateEventDto: UpdateEventDto = {
        title: 'Updated Event',
      };

      const mockEvent = {
        id: eventId,
        title: 'Test Event',
      };

      const mockUpdatedEvent = {
        id: eventId,
        title: 'Updated Event',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.update.mockResolvedValue(mockUpdatedEvent);

      const result = await service.update(eventId, updateEventDto);

      expect(result).toEqual(mockUpdatedEvent);
      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: updateEventDto,
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      const eventId = 'non-existent';
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.update(eventId, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an event and its images', async () => {
      const eventId = 'event-123';
      const mockEvent = {
        id: eventId,
        images: ['url1', 'url2'],
        image: 'main-url',
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockPrismaService.event.delete.mockResolvedValue(mockEvent);
      mockS3Service.deleteMultipleFiles.mockResolvedValue(undefined);
      mockS3Service.deleteFile.mockResolvedValue(undefined);

      const result = await service.remove(eventId);

      expect(result).toEqual(mockEvent);
      expect(mockS3Service.deleteMultipleFiles).toHaveBeenCalledWith(['url1', 'url2']);
      expect(mockS3Service.deleteFile).toHaveBeenCalledWith('main-url');
      expect(mockPrismaService.event.delete).toHaveBeenCalledWith({
        where: { id: eventId },
      });
    });

    it('should throw NotFoundException if event not found', async () => {
      const eventId = 'non-existent';
      mockPrismaService.event.findUnique.mockResolvedValue(null);

      await expect(service.remove(eventId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadImages', () => {
    it('should upload images to an event', async () => {
      const eventId = 'event-123';
      const files = [
        { originalname: 'file1.jpg', buffer: Buffer.from('test'), mimetype: 'image/jpeg' },
      ] as Express.Multer.File[];

      const mockEvent = { id: eventId, images: [] };
      const uploadedUrls = ['url1'];

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockS3Service.uploadMultipleFiles.mockResolvedValue(uploadedUrls);
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        images: uploadedUrls,
      });

      const result = await service.uploadImages(eventId, files);

      expect(mockS3Service.uploadMultipleFiles).toHaveBeenCalledWith(files, 'events');
      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: {
          images: {
            push: uploadedUrls,
          },
        },
      });
    });
  });

  describe('deleteImage', () => {
    it('should delete an image from an event', async () => {
      const eventId = 'event-123';
      const imageUrl = 'url1';
      const mockEvent = {
        id: eventId,
        images: ['url1', 'url2'],
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);
      mockS3Service.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.event.update.mockResolvedValue({
        ...mockEvent,
        images: ['url2'],
      });

      const result = await service.deleteImage(eventId, imageUrl);

      expect(mockS3Service.deleteFile).toHaveBeenCalledWith(imageUrl);
      expect(mockPrismaService.event.update).toHaveBeenCalledWith({
        where: { id: eventId },
        data: {
          images: {
            set: ['url2'],
          },
        },
      });
    });

    it('should throw NotFoundException if image not found', async () => {
      const eventId = 'event-123';
      const imageUrl = 'non-existent-url';
      const mockEvent = {
        id: eventId,
        images: ['url1', 'url2'],
      };

      mockPrismaService.event.findUnique.mockResolvedValue(mockEvent);

      await expect(service.deleteImage(eventId, imageUrl)).rejects.toThrow(NotFoundException);
    });
  });
});
