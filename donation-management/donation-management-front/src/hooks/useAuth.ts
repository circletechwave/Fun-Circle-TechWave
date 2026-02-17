import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authLogger } from '../services/authLogger';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'system' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialLoadComplete = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setSession(session);

        if (session?.user?.id) {
          try {
            // タイムアウト付きでロール取得（5秒）
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
            );

            const fetchPromise = supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (!mounted) return;

            if (error) {
              setUserRole('user');
            } else {
              setUserRole(data?.role || 'user');
            }
          } catch (error) {
            if (mounted) {
              setUserRole('user');
            }
          }
        } else {
          setUserRole(null);
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
  };

  return { session, userRole, isAdmin, loading, signOut };
}
