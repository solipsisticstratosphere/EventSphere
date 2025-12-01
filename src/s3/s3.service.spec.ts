import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../shared/services/s3.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

jest.mock('@aws-sdk/client-s3');
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;
  let mockS3Send: jest.Mock;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        AWS_S3_BUCKET: 'test-bucket',
        AWS_REGION: 'us-east-1',
        AWS_S3_ENDPOINT: 'http://localhost:4566',
        AWS_ACCESS_KEY_ID: 'test',
        AWS_SECRET_ACCESS_KEY: 'test',
        AWS_S3_FORCE_PATH_STYLE: true,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    mockS3Send = jest.fn().mockResolvedValue({});

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => ({
      send: mockS3Send,
    } as any));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload a file to S3', async () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      mockS3Send.mockResolvedValue({});

      const result = await service.uploadFile(file, 'events');

      expect(result).toBe('http://localhost:4566/test-bucket/events/test-uuid-1234.jpg');
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(PutObjectCommand));
    });

    it('should throw error if upload fails', async () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      const error = new Error('Upload failed');
      mockS3Send.mockRejectedValue(error);

      await expect(service.uploadFile(file, 'events')).rejects.toThrow('Upload failed');
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files to S3', async () => {
      const files: Express.Multer.File[] = [
        {
          fieldname: 'file',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test1'),
          size: 1024,
          stream: null,
          destination: '',
          filename: '',
          path: '',
        },
        {
          fieldname: 'file',
          originalname: 'test2.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test2'),
          size: 1024,
          stream: null,
          destination: '',
          filename: '',
          path: '',
        },
      ];

      mockS3Send.mockResolvedValue({});

      const result = await service.uploadMultipleFiles(files, 'events');

      expect(result).toHaveLength(2);
      expect(mockS3Send).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from S3', async () => {
      const fileUrl = 'http://localhost:4566/test-bucket/events/test.jpg';

      mockS3Send.mockResolvedValue({});

      await service.deleteFile(fileUrl);

      expect(mockS3Send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });

    it('should throw error if delete fails', async () => {
      const fileUrl = 'http://localhost:4566/test-bucket/events/test.jpg';
      const error = new Error('Delete failed');
      mockS3Send.mockRejectedValue(error);

      await expect(service.deleteFile(fileUrl)).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteMultipleFiles', () => {
    it('should delete multiple files from S3', async () => {
      const fileUrls = [
        'http://localhost:4566/test-bucket/events/test1.jpg',
        'http://localhost:4566/test-bucket/events/test2.jpg',
      ];

      mockS3Send.mockResolvedValue({});

      await service.deleteMultipleFiles(fileUrls);

      expect(mockS3Send).toHaveBeenCalledTimes(2);
    });
  });

  describe('getFile', () => {
    it('should retrieve a file from S3', async () => {
      const fileUrl = 'http://localhost:4566/test-bucket/events/test.jpg';
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('test content');
        },
      };

      mockS3Send.mockResolvedValue({ Body: mockBody });

      const result = await service.getFile(fileUrl);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockS3Send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
    });

    it('should throw error if get fails', async () => {
      const fileUrl = 'http://localhost:4566/test-bucket/events/test.jpg';
      const error = new Error('Get failed');
      mockS3Send.mockRejectedValue(error);

      await expect(service.getFile(fileUrl)).rejects.toThrow('Get failed');
    });
  });
});
