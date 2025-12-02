import { Injectable } from '@nestjs/common';
import { S3Service } from '../../../../shared/services/s3.service';
import { FileUploadService } from '../../application/use-cases/upload-event-images.use-case';
import { FileDeleteService } from '../../application/use-cases/delete-event-image.use-case';

@Injectable()
export class S3FileAdapter implements FileUploadService, FileDeleteService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadMultipleFiles(files: Express.Multer.File[], folder: string): Promise<string[]> {
    return this.s3Service.uploadMultipleFiles(files, folder);
  }

  async deleteFile(url: string): Promise<void> {
    await this.s3Service.deleteFile(url);
  }

  async deleteMultipleFiles(urls: string[]): Promise<void> {
    await this.s3Service.deleteMultipleFiles(urls);
  }
}

