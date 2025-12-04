import { IsNotEmpty, IsString, IsNumber, IsDateString, IsOptional, IsArray, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    example: 'Music Festival',
    description: 'Event title',
    maxLength: 200
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Join us',
    description: 'Event description',
    maxLength: 2000
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    example: '2024-08-15T18:00:00Z',
    description: 'Event date and time in ISO format'
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: 'Central Park',
    description: 'Event location'
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    example: 49.99,
    description: 'Ticket price',
    minimum: 0
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    example: 'https://example.com/event-image.jpg',
    description: 'Main event image URL'
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'Additional event images',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    example: 'https://example.com/thumbnail.jpg',
    description: 'Thumbnail image URL'
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    example: 'Music',
    description: 'Event category'
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Event status',
    default: 'ACTIVE'
  })
  @IsString()
  @IsOptional()
  status?: string;
}



