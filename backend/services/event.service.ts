import { EventStatus } from '../types/database.types';

export interface EventFilterOptions {
  search?: string;
  category?: string;
  host_id?: string;
  status?: EventStatus;
  is_featured?: boolean;
  min_price?: number;
  max_price?: number;
  city?: string;
  sort_by?: 'upcoming' | 'popular' | 'newest' | 'featured';
  page?: number;
  limit?: number;
}

export class EventService {
  /**
   * Helper to format public event query parameters for server-side fetching.
   * Event data must always come from the database; no mock-event fallback exists.
   */
  static buildQueryFilter(options: EventFilterOptions) {
    const page = options.page || 1;
    const limit = options.limit || 12;
    const offset = (page - 1) * limit;

    return {
      search: options.search?.trim(),
      category: options.category,
      host_id: options.host_id,
      status: options.status || 'PUBLISHED',
      is_featured: options.is_featured,
      sort_by: options.sort_by || 'upcoming',
      offset,
      limit,
    };
  }
}
