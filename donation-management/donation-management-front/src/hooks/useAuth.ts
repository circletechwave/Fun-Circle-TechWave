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

    console.log('[useAuth] Initializing auth listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state change event:', event, 'User:', session?.user?.email || 'No user');

        if (!mounted) {
          console.log('[useAuth] Component unmounted, ignoring auth state change');
          return;
        }

        // ログ記録はAuth.tsxで明示的に行うため、ここでは行わない
        // （既存セッション復元時もSIGNED_INが発火してしまうため）

        setSession(session);

        if (session?.user?.id) {
          try {
            console.log('[useAuth] Fetching role for user on state change:', session.user.id);
            const { data, error } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();

            if (!mounted) {
              console.log('[useAuth] Component unmounted during role fetch');
              return;
            }

            if (error) {
              console.error('[useAuth] Failed to fetch user role on state change:', error);
              setUserRole('user');
            } else {
              console.log('[useAuth] Role fetched on state change:', data?.role);
              setUserRole(data?.role || 'user');
            }
          } catch (error) {
            console.error('[useAuth] Error fetching user role on state change:', error);
            if (mounted) {
              setUserRole('user');
            }
          }
        } else {
          console.log('[useAuth] No session on state change, clearing userRole');
          setUserRole(null);
        }

        // 初回ロード完了をマーク
        if (!initialLoadComplete) {
          console.log('[useAuth] Initial load complete, setting loading to false');
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
