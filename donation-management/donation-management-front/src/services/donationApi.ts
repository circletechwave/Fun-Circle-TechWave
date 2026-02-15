import type { Donation, Category, Location, SearchFilters, PaginationInfo, Tag } from '../types/donation';

import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

/**
 * 認証トークンを取得
 */
async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * API用のfetchラッパー
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `APIエラー: ${response.status}`);
  }

  return response.json();
}

interface DonationListResponse {
  success: boolean;
  data: Donation[];
  pagination: PaginationInfo;
  error?: string;
}

interface CategoryListResponse {
  success: boolean;
  data: Category[];
  error?: string;
}

interface LocationListResponse {
  success: boolean;
  data: Location[];
  error?: string;
}

interface TagListResponse {
  success: boolean;
  data: Tag[];
  error?: string;
}

export const donationApi = {
  // ... (searchDonations is unchanged)

  async searchDonations(filters: Partial<SearchFilters>): Promise<DonationListResponse> {
    try {
      let query = supabase
        .from('donations')
        .select(`
          *,
          categories (id, name),
          sub_categories (id, name),
          locations (id, name),
          donation_images (image_url, display_order),
          donation_tags!left (
            tags (id, name)
          )
        `, { count: 'exact' })
        .is('deleted_at', null);

      // Apply filters
      if (filters.tag_id) {
        // Use inner join for tag filtering
        query = query.filter('donation_tags.tag_id', 'eq', filters.tag_id);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.sub_category_id) {
        query = query.eq('sub_category_id', filters.sub_category_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }
      if (filters.keyword) {
        query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,author.ilike.%${filters.keyword}%`);
      }

      // Apply sorting
      const sort = filters.sort || '-created_at';
      const isAsc = !sort.startsWith('-');
      const column = sort.replace('-', '');

      if (column === 'popular') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order(column, { ascending: isAsc });
      }

      // Apply pagination
      const page = filters.page || 1;
      const per_page = filters.per_page || 20;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      // Transform data to match Donation interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const donations: Donation[] = (data || []).map((item: any) => ({
        ...item,
        category: item.categories,
        sub_category: item.sub_categories,
        location: item.locations,
        // Ensure arrays are initialized if null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image_urls: item.donation_images?.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => img.image_url) || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tags: item.donation_tags?.map((dt: any) => dt.tags).filter(Boolean) || [],
      }));

      const total = count || 0;
      const total_pages = Math.ceil(total / per_page);

      return {
        success: true,
        data: donations,
        pagination: {
          page,
          per_page,
          total,
          total_pages,
        },
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
        error: error instanceof Error ? error.message : '検索に失敗しました',
      };
    }
  },

  async getDonation(id: string): Promise<{ success: boolean; data: Donation; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          categories (id, name),
          sub_categories (id, name),
          locations (id, name),
          donation_images (image_url, display_order),
          donation_tags (tags (id, name))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item: any = data;
      const donation: Donation = {
        ...item,
        category: item.categories,
        sub_category: item.sub_categories,
        location: item.locations,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image_urls: item.donation_images?.sort((a: any, b: any) => a.display_order - b.display_order).map((img: any) => img.image_url) || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tags: item.donation_tags?.map((dt: any) => dt.tags) || [],
      };

      return { success: true, data: donation };
    } catch (error) {
      return {
        success: false,
        data: {} as Donation,
        error: error instanceof Error ? error.message : '取得に失敗しました'
      };
    }
  },

  async createDonation(donation: Partial<Donation>): Promise<{ success: boolean; data: Donation; error?: string }> {
    try {
      const response = await apiFetch<{ success: boolean; data: Donation }>('/api/donations', {
        method: 'POST',
        body: JSON.stringify(donation),
      });

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        data: {} as Donation,
        error: error instanceof Error ? error.message : '登録に失敗しました'
      };
    }
  },

  async updateDonation(id: string, donation: Partial<Donation>): Promise<{ success: boolean; data: Donation; error?: string }> {
    try {
      const response = await apiFetch<{ success: boolean; data: Donation }>(`/api/donations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(donation),
      });

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        data: {} as Donation,
        error: error instanceof Error ? error.message : '更新に失敗しました'
      };
    }
  },

  async deleteDonation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiFetch<{ success: boolean }>(`/api/donations/${id}`, {
        method: 'DELETE',
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '削除に失敗しました' };
    }
  },

  async getCategories(): Promise<CategoryListResponse> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, sub_categories(*)')
        .order('display_order');

      if (error) throw error;
      return { success: true, data: data as Category[] };
    } catch (error) {
      return { success: false, data: [], error: error instanceof Error ? error.message : 'カテゴリの取得に失敗しました' };
    }
  },

  async getLocations(): Promise<LocationListResponse> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) throw error;
      return { success: true, data: data as Location[] };
    } catch (error) {
      return { success: false, data: [], error: error instanceof Error ? error.message : '保管場所の取得に失敗しました' };
    }
  },

  async getTags(): Promise<TagListResponse> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return { success: true, data: data as Tag[] };
    } catch (error) {
      return { success: false, data: [], error: error instanceof Error ? error.message : 'タグの取得に失敗しました' };
    }
  },
};