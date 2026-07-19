import { supabase } from '../lib/supabase';
import type { AuditLogFilters, AuditLogListResponse } from '../types/auditLog';
import type { AppUser, UserRole } from '../types/user';

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
   * ユーザー一覧を取得（管理画面でのロール変更対象選択用）
   */
  async getUsers(): Promise<{ success: boolean; data: AppUser[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, department, is_active, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, data: [], error: error.message || 'ユーザー一覧の取得に失敗しました' };
      }

      return { success: true, data: (data || []) as AppUser[] };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'ユーザー一覧の取得に失敗しました',
      };
    }
  },

  /**
   * ユーザーのロールを変更（admin/systemロールのみRLS・トリガーで許可）
   * 昇格・降格操作は監査ログに記録する
   */
  async updateUserRole(targetUser: AppUser, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', targetUser.id);

      if (error) {
        return { success: false, error: error.message || 'ロールの変更に失敗しました' };
      }

      // 監査ログに記録（エラーは無視、ユーザー体験を損なわない）
      const { data: { user } } = await supabase.auth.getUser();
      supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        action: 'USER_ROLE_UPDATE',
        table_name: 'users',
        record_id: targetUser.id,
        old_values: { role: targetUser.role },
        new_values: { role: newRole },
      }).then(undefined, () => {});

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ロールの変更に失敗しました',
      };
    }
  },
};
