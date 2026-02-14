import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'user' | 'admin' | 'system';

interface AuthState {
  session: Session | null;
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  isAdmin: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

/**
 * 認証状態とユーザーロールを管理するカスタムフック
 *
 * @returns 認証状態、ロール情報、ヘルパー関数
 *
 * @example
 * ```tsx
 * const { session, isAdmin, loading } = useAuth();
 *
 * if (loading) return <Loading />;
 * if (!session) return <LoginPage />;
 * if (isAdmin) return <AdminDashboard />;
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    userRole: null,
    loading: true,
    error: null,
  });

  /**
   * ユーザーのロール情報をSupabaseから取得
   */
  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();

      if (error) {
        throw error;
      }

      return (data?.role as UserRole) ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ロール取得に失敗しました';
      setState((prev) => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  /**
   * ロール情報を再取得
   */
  const refreshRole = useCallback(async () => {
    if (!state.user?.id) return;

    const role = await fetchUserRole(state.user.id);
    setState((prev) => ({ ...prev, userRole: role }));
  }, [state.user?.id, fetchUserRole]);

  /**
   * ログアウト処理
   */
  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setState({
        session: null,
        user: null,
        userRole: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ログアウトに失敗しました';
      setState((prev) => ({ ...prev, error: message }));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 現在のセッションを取得
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!isMounted) return;

        if (session?.user) {
          // ユーザーのロール情報を取得
          const role = await fetchUserRole(session.user.id);

          if (!isMounted) return;

          setState({
            session,
            user: session.user,
            userRole: role,
            loading: false,
            error: null,
          });
        } else {
          setState({
            session: null,
            user: null,
            userRole: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!isMounted) return;

        const message = error instanceof Error ? error.message : '認証の初期化に失敗しました';
        setState({
          session: null,
          user: null,
          userRole: null,
          loading: false,
          error: message,
        });
      }
    };

    initializeAuth();

    // 認証状態の変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setState({
          session: null,
          user: null,
          userRole: null,
          loading: false,
          error: null,
        });
        return;
      }

      if (session?.user) {
        const role = await fetchUserRole(session.user.id);

        if (!isMounted) return;

        setState({
          session,
          user: session.user,
          userRole: role,
          loading: false,
          error: null,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  return {
    ...state,
    isAdmin: state.userRole === 'admin' || state.userRole === 'system',
    isAuthenticated: state.session !== null,
    signOut,
    refreshRole,
  };
}
