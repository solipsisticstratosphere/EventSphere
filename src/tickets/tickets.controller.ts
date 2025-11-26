import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('purchase/:eventId')
  @UseGuards(JwtAuthGuard)
  purchaseTicket(@Request() req, @Param('eventId') eventId: string) {
    return this.ticketsService.purchaseTicket(req.user.id, eventId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(req.user.id, createTicketDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMyTickets(@Request() req) {
    return this.ticketsService.findByUser(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
