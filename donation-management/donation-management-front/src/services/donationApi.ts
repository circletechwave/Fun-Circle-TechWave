import type { Donation, Category, Location, SearchFilters, PaginationInfo } from '../types/donation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

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
    const params = new URLSearchParams();

    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.sub_category_id) params.append('sub_category_id', filters.sub_category_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.location_id) params.append('location_id', filters.location_id);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page) params.append('per_page', filters.per_page.toString());

    const response = await fetch(`${API_BASE_URL}/donations?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getDonation(id: string): Promise<{ success: boolean; data: Donation; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/donations/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async createDonation(donation: Partial<Donation>): Promise<{ success: boolean; data: Donation; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donation),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async updateDonation(id: string, donation: Partial<Donation>): Promise<{ success: boolean; data: Donation; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/donations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donation),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async deleteDonation(id: string): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${API_BASE_URL}/donations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async getCategories(): Promise<CategoryListResponse> {
    const response = await fetch(`${API_BASE_URL}/categories`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  async getLocations(): Promise<LocationListResponse> {
    const response = await fetch(`${API_BASE_URL}/locations`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};