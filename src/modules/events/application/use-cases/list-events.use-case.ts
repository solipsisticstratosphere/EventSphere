import { Injectable, Inject } from "@nestjs/common";
import {
  EventRepository,
  EventFilters,
  PaginationOptions,
  PaginatedResult,
} from "../../domain/repositories/event.repository.interface";
import { Event } from "../../domain/entities/event.entity";
import { QueryEventDto } from "../dto/query-event.dto";
import { EVENT_REPOSITORY } from "../../events.tokens";

@Injectable()
export class ListEventsUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY) private readonly eventRepository: EventRepository
  ) {}

  async execute(query: QueryEventDto): Promise<PaginatedResult<Event>> {
    const filters: EventFilters = {
      search: query.search,
      category: query.category,
      location: query.location,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      status: query.status,
    };

    const pagination: PaginationOptions = {
      page: query.page || 1,
      limit: query.limit || 10,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return this.eventRepository.findAll(filters, pagination);
  }
}
