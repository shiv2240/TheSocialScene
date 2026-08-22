import { EventItem, EventStatus } from '../types/database.types';

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
   * Helper to format public event query parameters for server-side fetching
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

  /**
   * Local Mock Data Provider when Supabase environment variables are pending setup
   */
  static getMockEvents(): EventItem[] {
    return [
      {
        id: 'evt-001',
        title: 'Sunday Sunset Run & Social',
        slug: 'sunday-sunset-run-bengaluru',
        short_description: '5km community run followed by artisan coffee, juice bars, and networking.',
        description: 'Join over 200+ running enthusiasts and social butterflies for our weekly sunset run through Indiranagar! Suitable for all fitness levels. Post-run refreshments included.',
        category_id: 'cat-004',
        host_id: 'host-001',
        venue_id: 'ven-001',
        start_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        end_at: new Date(Date.now() + 86400000 * 2 + 10800000).toISOString(),
        capacity: 150,
        registered_count: 98,
        price: 299,
        currency: 'INR',
        cover_image: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
        status: 'PUBLISHED',
        featured: true,
        registration_open: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'cat-004',
          name: 'Fitness & Wellness',
          slug: 'fitness-wellness',
          display_order: 4,
          created_at: new Date().toISOString(),
        },
        venue: {
          id: 'ven-001',
          name: 'The Social House Indiranagar',
          slug: 'social-house-indiranagar',
          address: '100ft Road, Indiranagar',
          city: 'Bengaluru',
          capacity: 250,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        host: {
          id: 'host-001',
          full_name: 'Bengaluru Runners Club',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: 'evt-002',
        title: 'Indie Music & Acoustic Rooftop Night',
        slug: 'indie-music-acoustic-rooftop-night',
        short_description: 'Intimate candle-lit rooftop acoustic performances by rising indie artists.',
        description: 'An intimate evening featuring 3 incredible singer-songwriters under the stars. Sip hand-crafted cocktails while enjoying original acoustic music.',
        category_id: 'cat-001',
        host_id: 'host-002',
        venue_id: 'ven-002',
        start_at: new Date(Date.now() + 86400000 * 5).toISOString(),
        end_at: new Date(Date.now() + 86400000 * 5 + 14400000).toISOString(),
        capacity: 80,
        registered_count: 72,
        price: 599,
        currency: 'INR',
        cover_image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        status: 'PUBLISHED',
        featured: true,
        registration_open: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'cat-001',
          name: 'Music & Concerts',
          slug: 'music-concerts',
          display_order: 1,
          created_at: new Date().toISOString(),
        },
        venue: {
          id: 'ven-002',
          name: 'Koramangala Social Studio',
          slug: 'koramangala-social-studio',
          address: '80ft Road, Koramangala 4th Block',
          city: 'Bengaluru',
          capacity: 180,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        host: {
          id: 'host-002',
          full_name: 'Acoustic Underground',
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
      {
        id: 'evt-003',
        title: 'AI Founders & Builders Mixer',
        slug: 'ai-founders-builders-mixer-gurugram',
        short_description: 'High-signal networking event for AI engineers, founders, and VCs.',
        description: 'Connect with 100+ AI practitioners building agentic workflows, LLM applications, and foundation models. Lightning talks + open bar.',
        category_id: 'cat-002',
        host_id: 'host-003',
        venue_id: 'ven-003',
        start_at: new Date(Date.now() + 86400000 * 7).toISOString(),
        end_at: new Date(Date.now() + 86400000 * 7 + 10800000).toISOString(),
        capacity: 120,
        registered_count: 120, // Sold out
        price: 0,
        currency: 'INR',
        cover_image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        status: 'PUBLISHED',
        featured: false,
        registration_open: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'cat-002',
          name: 'Tech & Networking',
          slug: 'tech-networking',
          display_order: 2,
          created_at: new Date().toISOString(),
        },
        venue: {
          id: 'ven-003',
          name: 'Cyber Hub Amphitheatre',
          slug: 'cyber-hub-amphitheatre',
          address: 'DLF Cyber City',
          city: 'Gurugram',
          capacity: 400,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        host: {
          id: 'host-003',
          full_name: 'Tech Collective India',
          avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    ];
  }
}
