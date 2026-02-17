import { supabase } from '../lib/supabase';

/**
 * 認証イベントを監査ログに記録
 */
export const authLogger = {
  /**
   * ログイン成功を記録
   */
  async logLoginSuccess(email: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: email,
        action: 'LOGIN_SUCCESS',
        ip_address: null,
        user_agent: navigator.userAgent,
      });
    } catch {
      // エラーは無視（監査ログの失敗でユーザー体験を損なわない）
    }
  },

  /**
   * ログイン失敗を記録
   */
  async logLoginFailure(email: string, errorMessage: string) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: email,
        action: 'LOGIN_FAILURE',
        error_message: errorMessage,
        user_agent: navigator.userAgent,
      });
    } catch {
      // エラーは無視（監査ログの失敗でユーザー体験を損なわない）
    }
  },

  /**
   * ログアウトを記録
   */
  async logLogout(email: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: email,
        action: 'LOGOUT',
        user_agent: navigator.userAgent,
      });
    } catch {
      // エラーは無視（監査ログの失敗でユーザー体験を損なわない）
    }
  },

  /**
   * 認証エラーを記録
   */
  async logAuthError(email: string | null, errorMessage: string) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: email,
        action: 'AUTH_ERROR',
        error_message: errorMessage,
        user_agent: navigator.userAgent,
      });
    } catch {
      // エラーは無視（監査ログの失敗でユーザー体験を損なわない）
    }
  },
};
