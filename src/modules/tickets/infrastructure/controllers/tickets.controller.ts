import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CreateTicketDto } from '../../application/dto/create-ticket.dto';
import { UpdateTicketDto } from '../../application/dto/update-ticket.dto';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { PurchaseTicketUseCase } from '../../application/use-cases/purchase-ticket.use-case';
import { CreateTicketUseCase } from '../../application/use-cases/create-ticket.use-case';
import { GetTicketUseCase } from '../../application/use-cases/get-ticket.use-case';
import { ListTicketsUseCase } from '../../application/use-cases/list-tickets.use-case';
import { GetUserTicketsUseCase } from '../../application/use-cases/get-user-tickets.use-case';
import { UpdateTicketUseCase } from '../../application/use-cases/update-ticket.use-case';
import { DeleteTicketUseCase } from '../../application/use-cases/delete-ticket.use-case';
import {
  TicketNotFoundError,
  TicketEventNotFoundError,
  TicketEventAlreadyPastError,
  TicketAlreadyExistsError,
  PaymentFailedError,
} from '../../domain/errors/ticket.errors';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly purchaseTicketUseCase: PurchaseTicketUseCase,
    private readonly createTicketUseCase: CreateTicketUseCase,
    private readonly getTicketUseCase: GetTicketUseCase,
    private readonly listTicketsUseCase: ListTicketsUseCase,
    private readonly getUserTicketsUseCase: GetUserTicketsUseCase,
    private readonly updateTicketUseCase: UpdateTicketUseCase,
    private readonly deleteTicketUseCase: DeleteTicketUseCase,
  ) {}

  @Post('purchase/:eventId')
  @UseGuards(JwtAuthGuard)
  async purchaseTicket(@Request() req, @Param('eventId') eventId: string) {
    try {
      return await this.purchaseTicketUseCase.execute(req.user.id, eventId);
    } catch (error) {
      if (error instanceof TicketEventNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof TicketEventAlreadyPastError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof TicketAlreadyExistsError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof PaymentFailedError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req, @Body() createTicketDto: CreateTicketDto) {
    const ticket = await this.createTicketUseCase.execute(req.user.id, createTicketDto);
    return this.mapTicketToResponse(ticket);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    const tickets = await this.listTicketsUseCase.execute();
    return tickets.map(ticket => this.mapTicketToResponse(ticket));
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyTickets(@Request() req) {
    const tickets = await this.getUserTicketsUseCase.execute(req.user.id);
    return tickets.map(ticket => this.mapTicketToResponse(ticket));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    try {
      const ticket = await this.getTicketUseCase.execute(id);
      return this.mapTicketToResponse(ticket);
    } catch (error) {
      if (error instanceof TicketNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    try {
      const ticket = await this.updateTicketUseCase.execute(id, updateTicketDto);
      return this.mapTicketToResponse(ticket);
    } catch (error) {
      if (error instanceof TicketNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    try {
      await this.deleteTicketUseCase.execute(id);
      return { message: 'Ticket deleted successfully' };
    } catch (error) {
      if (error instanceof TicketNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  private mapTicketToResponse(ticket: any) {
    return {
      id: ticket.id,
      eventId: ticket.eventId,
      userId: ticket.userId,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }
}

