import { supabase } from '../lib/supabase';
import type { AuditLogFilters, AuditLogListResponse } from '../types/auditLog';

/**
 * 管理者API（Supabase直接アクセス）
 */
export const adminApi = {
  /**
   * 監査ログ一覧を取得
   */
  async getAuditLogs(filters: Partial<AuditLogFilters> = {}): Promise<AuditLogListResponse> {
    const { page = 1, per_page = 50 } = filters;

    // ベースクエリ
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // フィルター適用
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name);
    }
    if (filters.date_from) {
      query = query.gte('created_at', `${filters.date_from}T00:00:00Z`);
    }
    if (filters.date_to) {
      query = query.lte('created_at', `${filters.date_to}T23:59:59Z`);
    }
    if (filters.keyword) {
      query = query.or(
        `user_email.ilike.%${filters.keyword}%,request_path.ilike.%${filters.keyword}%,error_message.ilike.%${filters.keyword}%`
      );
    }

    // ページネーション
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(error.message || 'ログの取得に失敗しました');
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / per_page);

    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        per_page,
        total,
        total_pages,
      },
    };
  },
};
