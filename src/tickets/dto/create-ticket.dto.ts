import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsOptional()
  status?: string;
}
