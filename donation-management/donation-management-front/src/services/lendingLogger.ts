import { supabase } from '../lib/supabase';

/**
 * 貸出・返却イベントを監査ログに記録
 */
export const lendingLogger = {
  /**
   * 貸出作成を記録
   * エラーは無視（監査ログの失敗でユーザー体験を損なわない）
   */
  async logLendingCreate(donationId: string, lendingId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      user_email: user?.email,
      action: 'LENDING_CREATE',
      table_name: 'lendings',
      record_id: lendingId,
      new_values: { donation_id: donationId },
      user_agent: navigator.userAgent,
    });
  },

  /**
   * 返却処理を記録
   * エラーは無視（監査ログの失敗でユーザー体験を損なわない）
   */
  async logLendingReturn(lendingId: string) {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      user_email: user?.email,
      action: 'LENDING_RETURN',
      table_name: 'lendings',
      record_id: lendingId,
      user_agent: navigator.userAgent,
    });
  },
};
