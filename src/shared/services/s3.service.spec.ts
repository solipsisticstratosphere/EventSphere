import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
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
        AWS_ACCESS_KEY_ID: 'test-key',
        AWS_SECRET_ACCESS_KEY: 'test-secret',
        AWS_S3_FORCE_PATH_STYLE: true,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    mockS3Send = jest.fn().mockResolvedValue({});
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: mockS3Send,
    }));

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
    it('should upload a file successfully', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test content'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const result = await service.uploadFile(mockFile, 'events');

      expect(result).toContain('test-bucket');
      expect(result).toContain('events');
      expect(result).toContain('test-uuid-1234');
      expect(mockS3Send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand),
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      const fileUrl = 'http://localhost:4566/test-bucket/events/test-uuid-1234.jpg';

      await service.deleteFile(fileUrl);

      expect(mockS3Send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand),
      );
    });
  });
});




