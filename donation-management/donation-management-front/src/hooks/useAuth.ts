import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { authLogger } from '../services/authLogger';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'system' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session?.user?.id) {
          console.log('Fetching user role for:', session.user.id);
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Failed to fetch user role:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            setUserRole('user');
          } else {
            console.log('User role data:', data);
            setUserRole(data?.role || 'user');
          }
        }
      } catch (error) {
        console.error('Error in loadUserData:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // OAuth認証成功時のみログ記録（既存セッション読み込み時は記録しない）
        if (event === 'SIGNED_IN' && session?.user?.email) {
          // ログ記録を非同期で実行（失敗してもUI処理を止めない）
          authLogger.logLoginSuccess(session.user.email).catch(err => {
            console.error('Failed to log login:', err);
          });
        }

        setSession(session);

        if (session?.user?.id) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (error) {
              console.error('Failed to fetch user role:', error);
              setUserRole('user');
            } else {
              setUserRole(data?.role || 'user');
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            setUserRole('user');
          }
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
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
