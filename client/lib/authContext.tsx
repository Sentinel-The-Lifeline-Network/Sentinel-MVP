'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes first — this is the canonical source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    // Kick off: get existing session, or sign in anonymously
    supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
      if (existing) {
        // Validate by fetching user server-side to catch stale/revoked tokens
        const { data: { user }, error } = await supabase.auth.getUser(existing.access_token);
        if (user && !error) {
          // Valid — onAuthStateChange will have already set it; nothing else needed
          return;
        }
        // Stale token — sign out and re-sign in anonymously
        await supabase.auth.signOut({ scope: 'local' });
      }

      // No valid session — try anonymous sign-in
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        // Anonymous auth not enabled in Supabase — stay signed out, show setup prompt
        setLoading(false);
      }
      // onAuthStateChange will fire and set loading = false on success
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
