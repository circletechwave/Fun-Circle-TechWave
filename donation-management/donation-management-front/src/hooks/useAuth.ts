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

    // 安全策: 10秒経過してもloadingがtrueの場合、強制的にfalseにする
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('[useAuth] Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 10000);

    const loadUserData = async () => {
      try {
        console.log('[useAuth] Starting loadUserData');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[useAuth] getSession completed, error:', sessionError, 'session:', session?.user?.email || 'No session');

        if (!mounted) {
          console.log('[useAuth] Component unmounted, aborting');
          return;
        }

        if (sessionError) {
          console.error('[useAuth] Session error:', sessionError);
          setSession(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        console.log('[useAuth] Setting session state');
        setSession(session);

        if (session?.user?.id) {
          console.log('[useAuth] Fetching user role for:', session.user.id);
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

          console.log('[useAuth] Role fetch completed, error:', error, 'data:', data);

          if (!mounted) {
            console.log('[useAuth] Component unmounted during role fetch, aborting');
            return;
          }

          if (error) {
            console.error('[useAuth] Failed to fetch user role:', error);
            console.error('[useAuth] Error details:', JSON.stringify(error, null, 2));
            setUserRole('user');
          } else {
            console.log('[useAuth] User role data:', data);
            setUserRole(data?.role || 'user');
          }
        } else {
          console.log('[useAuth] No session, setting userRole to null');
          setUserRole(null);
        }
      } catch (error) {
        console.error('[useAuth] Error in loadUserData:', error);
        if (mounted) {
          setSession(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          console.log('[useAuth] Setting loading to false');
          setLoading(false);
          clearTimeout(timeoutId); // タイムアウトをクリア
        } else {
          console.log('[useAuth] Component unmounted, skipping loading state update');
        }
      }
    };

    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state change event:', event, 'User:', session?.user?.email || 'No user');

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

            if (error) {
              console.error('[useAuth] Failed to fetch user role on state change:', error);
              setUserRole('user');
            } else {
              console.log('[useAuth] Role fetched on state change:', data?.role);
              setUserRole(data?.role || 'user');
            }
          } catch (error) {
            console.error('[useAuth] Error fetching user role on state change:', error);
            setUserRole('user');
          }
        } else {
          console.log('[useAuth] No session on state change, clearing userRole');
          setUserRole(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
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
