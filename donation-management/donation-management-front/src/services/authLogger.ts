import { supabase } from '../lib/supabase';

/**
 * 認証イベントを監査ログに記録
 */
export const authLogger = {
  /**
   * ログイン成功を記録
   * エラーは無視（監査ログの失敗でユーザー体験を損なわない）
   */
  async logLoginSuccess(email: string) {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      user_email: email,
      action: 'LOGIN_SUCCESS',
      ip_address: null,
      user_agent: navigator.userAgent,
    });
  },

  /**
   * ログイン失敗を記録
   * エラーは無視（監査ログの失敗でユーザー体験を損なわない）
   */
  async logLoginFailure(email: string, errorMessage: string) {
    await supabase.from('audit_logs').insert({
      user_id: null,
      user_email: email,
      action: 'LOGIN_FAILURE',
      error_message: errorMessage,
      user_agent: navigator.userAgent,
    });
  },

  /**
   * ログアウトを記録
   * エラーは無視（監査ログの失敗でユーザー体験を損なわない）
   */
  async logLogout(email: string) {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      user_email: email,
      action: 'LOGOUT',
      user_agent: navigator.userAgent,
    });
  },

  /**
   * 認証エラーを記録
   * エラーは無視（監査ログの失敗でユーザー体験を損なわない）
   */
  async logAuthError(email: string | null, errorMessage: string) {
    await supabase.from('audit_logs').insert({
      user_id: null,
      user_email: email,
      action: 'AUTH_ERROR',
      error_message: errorMessage,
      user_agent: navigator.userAgent,
    });
  },

  /**
   * パスワード再設定メールの送信リクエストを記録
   * 未ログイン状態で実行されるため user_id は常に null
   * エラーは無視（監査ログの失敗でユーザー体験を損なわない）
   */
  async logPasswordResetRequest(email: string) {
    await supabase.from('audit_logs').insert({
      user_id: null,
      user_email: email,
      action: 'PASSWORD_RESET_REQUEST',
      user_agent: navigator.userAgent,
    });
  },

  /**
   * パスワード再設定の完了を記録
   * リセットリンク経由の一時セッションでログイン中のため user_id を取得できる
   * エラーは無視（監査ログの失敗でユーザー体験を損なわない）
   */
  async logPasswordResetComplete(email: string | null) {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      user_email: email ?? user?.email ?? null,
      action: 'PASSWORD_RESET_COMPLETE',
      user_agent: navigator.userAgent,
    });
  },
};
