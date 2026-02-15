import { supabase } from '../lib/supabase';
import type { AuditLogFilters, AuditLogListResponse } from '../types/auditLog';

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
 * 管理者API用のfetchラッパー
 */
async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('認証が必要です');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('認証が必要です');
    }
    if (response.status === 403) {
      throw new Error('管理者権限が必要です');
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `APIエラー: ${response.status}`);
  }

  return response.json();
}

/**
 * 管理者API
 */
export const adminApi = {
  /**
   * 監査ログ一覧を取得
   */
  async getAuditLogs(filters: Partial<AuditLogFilters> = {}): Promise<AuditLogListResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', String(filters.page));
    if (filters.per_page) params.append('per_page', String(filters.per_page));
    if (filters.action) params.append('action', filters.action);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.table_name) params.append('table_name', filters.table_name);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.keyword) params.append('keyword', filters.keyword);

    const queryString = params.toString();
    const endpoint = `/api/admin/audit-logs${queryString ? `?${queryString}` : ''}`;

    return adminFetch<AuditLogListResponse>(endpoint);
  },
};
