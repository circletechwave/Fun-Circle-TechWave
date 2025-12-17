export interface Donation {
  id: string;
  title: string;
  category_id: string;
  sub_category_id?: string;
  location_id: string;
  status: 'available' | 'lending' | 'maintenance' | 'lost';
  condition?: 'new' | 'good' | 'fair' | 'poor';
  description?: string;
  isbn?: string;
  author?: string;
  publisher?: string;
  published_year?: number;
  manufacturer?: string;
  model_number?: string;
  donor_name?: string;
  donated_date: string;
  image_url?: string;

  // Nested objects for display
  category?: {
    id: string;
    name: string;
  };
  sub_category?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };

  avg_rating?: number;
  review_count?: number;
  image_urls?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  sub_categories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
}

export interface Location {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  room?: string;
  shelf?: string;
}

export interface SearchFilters {
  keyword: string;
  category_id?: string;
  sub_category_id?: string;
  status?: 'available' | 'lending' | 'maintenance' | 'lost';
  location_id?: string;
  sort: 'created_at' | '-created_at' | 'title' | '-title' | 'popular';
  page: number;
  per_page: number;
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}