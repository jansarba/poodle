import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { supabase } from '$lib/supabaseClient';
import { api } from '$lib/utils/api';
import { goto } from '$app/navigation';
import type { Session } from '@supabase/supabase-js';

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string | null;
  avatarUrl?: string | null;
};

export const user: Writable<AuthUser | null> = writable(null);
export const session: Writable<Session | null> = writable(null);
export const isLoadingUser = writable(true);

const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';

// restore session from supabase or local jwt on app start
export async function initializeAuth() {
  if (!browser) {
    isLoadingUser.set(false);
    return;
  }

  try {
    if (useSupabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        session.set(data.session);
        try {
          const profile = await api('users/me');
          user.set({ id: data.session.user.id, email: data.session.user.email!, full_name: profile.full_name, avatarUrl: profile.avatarUrl });
        } catch {
          user.set({ id: data.session.user.id, email: data.session.user.email! });
        }
      }
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        const profile = await api('users/me');
        user.set({ id: profile.id, email: profile.email, full_name: profile.full_name, avatarUrl: profile.avatarUrl });
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('AuthStore: Failed to initialize auth state.', error.message);
    } else {
      console.error('AuthStore: Failed to initialize auth state.', error);
    }
    user.set(null);
    session.set(null);
    localStorage.removeItem('token');
  } finally {
    isLoadingUser.set(false);
  }
}

// keep local token in sync with supabase session changes
if (browser && useSupabase) {
  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    session.set(newSession);

    if (newSession?.access_token) {
        localStorage.setItem('token', newSession.access_token);
    } else {
        localStorage.removeItem('token');
    }

    if (newSession) {
      try {
        const profile = await api('users/me');
        user.set({ id: newSession.user.id, email: newSession.user.email!, full_name: profile.full_name, avatarUrl: profile.avatarUrl });
      } catch {
        user.set({ id: newSession.user.id, email: newSession.user.email! });
      }
    } else {
      user.set(null);
    }

    if (!newSession && window.location.pathname !== '/login') {
      goto('/login');
    }
  });
}

export async function logout() {
  if (useSupabase) {
    await supabase.auth.signOut();
  }

  localStorage.removeItem('token');
  user.set(null);
  session.set(null);
  goto('/login');
}
