import { supabase } from '../lib/supabase';
import type { AuditLogFilters, AuditLogListResponse } from '../types/auditLog';
import type { Tag } from '../types/donation';

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

  /**
   * タグを新規作成（admin/systemロールのみRLSで許可）
   */
  async createTag(name: string): Promise<{ success: boolean; data: Tag | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name })
        .select()
        .single();

      if (error) {
        // 同名タグが既に存在する場合(UNIQUE制約違反)
        if (error.code === '23505') {
          return { success: false, data: null, error: '同じ名前のタグが既に存在します' };
        }
        return { success: false, data: null, error: error.message || 'タグの作成に失敗しました' };
      }

      return { success: true, data: data as Tag };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'タグの作成に失敗しました',
      };
    }
  },

  /**
   * タグを削除（admin/systemロールのみRLSで許可）
   * 使用中のタグ(donation_tagsに紐付いているもの)はFK制約により削除が拒否される
   */
  async deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('tags').delete().eq('id', id);

      if (error) {
        // 使用中タグの削除(外部キー制約違反)
        if (error.code === '23503') {
          return { success: false, error: 'このタグは寄贈物に使用されているため削除できません' };
        }
        return { success: false, error: error.message || 'タグの削除に失敗しました' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'タグの削除に失敗しました',
      };
    }
  },
};
