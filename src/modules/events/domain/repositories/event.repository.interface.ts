import { Event } from "../entities/event.entity";

export type EventCreateData = Omit<
  Event,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "isPast"
  | "canBePurchased"
  | "addImage"
  | "removeImage"
>;
export type EventUpdateData = Partial<{
  title: string;
  description: string;
  date: Date;
  location: string;
  price: number;
  image: string | null;
  images: string[];
  thumbnailUrl: string | null;
  category: string;
  status: string;
}>;

export interface EventRepository {
  create(event: EventCreateData): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findAll(
    filters: EventFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<Event>>;
  update(id: string, data: EventUpdateData): Promise<Event>;
  delete(id: string): Promise<void>;
  updateImages(eventId: string, images: string[]): Promise<Event>;
}

export interface EventFilters {
  search?: string;
  category?: string;
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
