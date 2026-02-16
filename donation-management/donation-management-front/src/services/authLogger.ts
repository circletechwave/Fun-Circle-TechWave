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

      const { error } = await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: email,
        action: 'LOGIN_SUCCESS',
        ip_address: null, // フロントエンドからは取得不可
        user_agent: navigator.userAgent,
      }).select();

      if (error) {
        console.error('Failed to log login success:', error);
      }
    } catch (error) {
      console.error('Failed to log login success:', error);
    }
  },

  /**
   * ログイン失敗を記録
   */
  async logLoginFailure(email: string, errorMessage: string) {
    try {
      console.log('[authLogger] Attempting to log login failure for:', email);

      // .select()を使わない（未認証ユーザーはSELECTポリシーでusersテーブルにアクセスできないため）
      const { error } = await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: email,
        action: 'LOGIN_FAILURE',
        error_message: errorMessage,
        user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('[authLogger] Supabase error when logging login failure:', error);
        console.error('[authLogger] Error code:', error.code);
        console.error('[authLogger] Error message:', error.message);
        throw error;
      }

      console.log('[authLogger] Successfully logged login failure');
    } catch (error) {
      console.error('[authLogger] Failed to log login failure (caught):', error);
    }
  },

  /**
   * ログアウトを記録
   */
  async logLogout(email: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: email,
        action: 'LOGOUT',
        user_agent: navigator.userAgent,
      }).select();

      if (error) {
        console.error('Failed to log logout:', error);
      }
    } catch (error) {
      console.error('Failed to log logout:', error);
    }
  },

  /**
   * 認証エラーを記録
   */
  async logAuthError(email: string | null, errorMessage: string) {
    try {
      // .select()を使わない（未認証ユーザーはSELECTポリシーでusersテーブルにアクセスできないため）
      const { error } = await supabase.from('audit_logs').insert({
        user_id: null,
        user_email: email,
        action: 'AUTH_ERROR',
        error_message: errorMessage,
        user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('Failed to log auth error:', error);
      }
    } catch (error) {
      console.error('Failed to log auth error:', error);
    }
  },
};
