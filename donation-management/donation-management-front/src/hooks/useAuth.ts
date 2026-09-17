import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authLogger } from '../services/authLogger';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'system' | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // パスワード再設定リンク経由でアクセスされた場合にtrueになる
  // （Supabaseがリンクのトークンを検証し、一時セッションを確立した際にPASSWORD_RECOVERYイベントを発火する）
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        if (_event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true);
        }

        setSession(session);

        if (session?.user?.id) {
          try {
            // タイムアウト付きでロール取得（5秒）
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
            );

            const fetchPromise = supabase
              .from('users')
              .select('role, name')
              .eq('id', session.user.id)
              .single();

            const result = await Promise.race([fetchPromise, timeoutPromise]) as { data: { role?: 'user' | 'admin' | 'system', name?: string } | null; error: unknown };

            if (!mounted) return;

            if (result.error) {
              setUserRole('user');
              setUserName(null);
            } else if (result.data) {
              setUserRole(result.data.role || 'user');
              setUserName(result.data.name || null);
            } else {
              setUserRole('user');
              setUserName(null);
            }
          } catch {
            if (mounted) {
              setUserRole('user');
              setUserName(null);
            }
          }
        } else {
          setUserRole(null);
          setUserName(null);
        }

        // 初回ロード完了をマーク
        if (!initialLoadComplete) {
          initialLoadComplete = true;
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = userRole === 'admin' || userRole === 'system';

  const signOut = async () => {
    const email = session?.user?.email;
    if (email) {
      await authLogger.logLogout(email);
    }
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setUserName(null);
  };

  // パスワード再設定フォームでの設定完了後に、通常の画面へ戻すために呼び出す
  const clearPasswordRecovery = () => {
    setPasswordRecovery(false);
  };

  return { session, userRole, userName, isAdmin, loading, signOut, passwordRecovery, clearPasswordRecovery };
}
