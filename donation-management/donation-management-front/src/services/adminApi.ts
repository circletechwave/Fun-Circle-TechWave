import { supabase } from '../lib/supabase';
import type { AuditLogFilters, AuditLogListResponse } from '../types/auditLog';
import type { Category, SubCategory, Location, Tag } from '../types/donation';

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
   * カテゴリを新規作成（admin/systemロールのみRLSで許可）
   */
  async createCategory(name: string, description?: string): Promise<{ success: boolean; data: Category | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, description: description || null })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, data: null, error: '同じ名前のカテゴリが既に存在します' };
        }
        return { success: false, data: null, error: error.message || 'カテゴリの作成に失敗しました' };
      }

      return { success: true, data: { ...data, sub_categories: [] } as Category };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'カテゴリの作成に失敗しました',
      };
    }
  },

  /**
   * カテゴリを削除（admin/systemロールのみRLSで許可）
   * 使用中(donations参照あり)、または子sub_categoriesが存在する場合は
   * FK制約により削除が拒否される
   */
  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) {
        if (error.code === '23503') {
          return { success: false, error: 'このカテゴリはサブカテゴリまたは寄贈物に使用されているため削除できません' };
        }
        return { success: false, error: error.message || 'カテゴリの削除に失敗しました' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'カテゴリの削除に失敗しました',
      };
    }
  },

  /**
   * サブカテゴリを新規作成（admin/systemロールのみRLSで許可）
   */
  async createSubCategory(categoryId: string, name: string, description?: string): Promise<{ success: boolean; data: SubCategory | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('sub_categories')
        .insert({ category_id: categoryId, name, description: description || null })
        .select()
        .single();

      if (error) {
        return { success: false, data: null, error: error.message || 'サブカテゴリの作成に失敗しました' };
      }

      return { success: true, data: data as SubCategory };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'サブカテゴリの作成に失敗しました',
      };
    }
  },

  /**
   * サブカテゴリを削除（admin/systemロールのみRLSで許可）
   * 使用中(donations参照あり)の場合はFK制約により削除が拒否される
   */
  async deleteSubCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('sub_categories').delete().eq('id', id);

      if (error) {
        if (error.code === '23503') {
          return { success: false, error: 'このサブカテゴリは寄贈物に使用されているため削除できません' };
        }
        return { success: false, error: error.message || 'サブカテゴリの削除に失敗しました' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'サブカテゴリの削除に失敗しました',
      };
    }
  },

  /**
   * 保管場所を新規作成（admin/systemロールのみRLSで許可）
   */
  async createLocation(location: { name: string; building?: string; floor?: string; room?: string; shelf?: string }): Promise<{ success: boolean; data: Location | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: location.name,
          building: location.building || null,
          floor: location.floor || null,
          room: location.room || null,
          shelf: location.shelf || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, data: null, error: '同じ名前の保管場所が既に存在します' };
        }
        return { success: false, data: null, error: error.message || '保管場所の作成に失敗しました' };
      }

      return { success: true, data: data as Location };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '保管場所の作成に失敗しました',
      };
    }
  },

  /**
   * 保管場所を削除（admin/systemロールのみRLSで許可）
   * 使用中(donations参照あり)の場合はFK制約により削除が拒否される
   */
  async deleteLocation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('locations').delete().eq('id', id);

      if (error) {
        if (error.code === '23503') {
          return { success: false, error: 'この保管場所は寄贈物に使用されているため削除できません' };
        }
        return { success: false, error: error.message || '保管場所の削除に失敗しました' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '保管場所の削除に失敗しました',
      };
    }
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
