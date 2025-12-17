import type { Donation, Category, Location, SearchFilters, PaginationInfo } from '../types/donation';

import { supabase } from '../lib/supabase';
import type { Donation, Category, Location, SearchFilters, PaginationInfo } from '../types/donation';

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

export const donationApi = {
  async searchDonations(filters: Partial<SearchFilters>): Promise<DonationListResponse> {
    try {
      let query = supabase
        .from('donations')
        .select(`
          *,
          categories (id, name),
          sub_categories (id, name),
          locations (id, name)
        `, { count: 'exact' })
        .is('deleted_at', null);

      // Apply filters
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
      const donations: Donation[] = (data || []).map((item: any) => ({
        ...item,
        category: item.categories,
        sub_category: item.sub_categories,
        location: item.locations,
        // Ensure arrays are initialized if null
        image_urls: item.image_urls || [],
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
          locations (id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const donation: Donation = {
        ...data,
        category: data.categories,
        sub_category: data.sub_categories,
        location: data.locations,
        image_urls: data.image_urls || [],
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
      // Remove nested objects and undefined fields before insert
      const {
        category, sub_category, location,
        id, created_at, updated_at,
        ...insertData
      } = donation as any;

      // Add created_by (using current user if available, otherwise dummy)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || '00000000-0000-4000-8000-000000000001';

      const { data, error } = await supabase
        .from('donations')
        .insert({ ...insertData, created_by: userId })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
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
      const {
        category, sub_category, location,
        id: _id, created_at, updated_at,
        ...updateData
      } = donation as any;

      const { data, error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
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
      const { error } = await supabase
        .from('donations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
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
};