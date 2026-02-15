import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
        }
      } catch (error) {
        console.error('Error in loadUserData:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
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
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
  };

  return { session, userRole, isAdmin, loading, signOut };
}
