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
export const isLoadingUser = writable(true); // Zaczyna jako true; layout nasłuchuje na zmianę na false.

// Odczytanie flagi z .env, aby wiedzieć, w którym trybie działać.
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';

/**
 * Inicjalizuje stan autentykacji przy starcie aplikacji.
 * Sprawdza, czy istnieje aktywna sesja (Supabase) lub token (lokalnie).
 * Ta funkcja jest wywoływana raz w głównym pliku layoutu.
 */
export async function initializeAuth() {
  // Nie robimy nic po stronie serwera.
  if (!browser) {
    isLoadingUser.set(false);
    return;
  }
  
  console.log('AuthStore: Starting user initialization...');

  try {
    if (useSupabase) {
      // Tryb Supabase: pobieramy sesję bezpośrednio z klienta Supabase.
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log('AuthStore: Found active Supabase session.');
        session.set(data.session);
        // Fetch full profile to get full_name and avatarUrl
        try {
          const profile = await api('users/me');
          user.set({ id: data.session.user.id, email: data.session.user.email!, full_name: profile.full_name, avatarUrl: profile.avatarUrl });
        } catch {
          user.set({ id: data.session.user.id, email: data.session.user.email! });
        }
      } else {
        console.log('AuthStore: No active Supabase session found.');
      }
    } else {
      // Tryb lokalny: szukamy tokenu JWT w localStorage.
      const token = localStorage.getItem('token');
      if (token) {
        console.log('AuthStore: Found local token, verifying with /users/me endpoint...');
        // Fetch full profile including full_name and avatarUrl
        const profile = await api('users/me');
        console.log('AuthStore: Local token is valid. User profile received:', profile);
        user.set({ id: profile.id, email: profile.email, full_name: profile.full_name, avatarUrl: profile.avatarUrl });
      } else {
        console.log('AuthStore: No local token found.');
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('AuthStore: Failed to initialize auth state. This can happen if the token is expired or invalid.', error.message);
    } else {
      console.error('AuthStore: Failed to initialize auth state. This can happen if the token is expired or invalid.', error);
    }
    // W przypadku błędu (np. wygaśnięty token), czyścimy cały stan.
    user.set(null);
    session.set(null);
    localStorage.removeItem('token');
  } finally {
    // Niezależnie od wyniku, kończymy stan ładowania.
    // To odblokowuje UI w `+layout.svelte`.
    console.log('AuthStore: User initialization process finished.');
    isLoadingUser.set(false);
  }
}

// Listener dla zmian stanu w Supabase (uruchamia się tylko w trybie Supabase).
// Automatycznie aktualizuje stan aplikacji, gdy użytkownik się zaloguje/wyloguje w innej karcie.
if (browser && useSupabase) {
  supabase.auth.onAuthStateChange(async (_event, newSession) => {
    console.log(`AuthStore: Supabase auth state changed. Event: ${_event}`, newSession);
    session.set(newSession);

    // Synchronizujemy token, aby nasz helper `api` mógł go używać (np. do zapytań do naszego backendu).
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

    // Jeśli użytkownik się wylogował, a nie jest na stronie logowania, przekierowujemy go.
    if (!newSession && window.location.pathname !== '/login') {
      goto('/login');
    }
  });
}

/**
 * Centralna funkcja do wylogowywania użytkownika.
 */
export async function logout() {
  console.log('AuthStore: Logging out user...');
  if (useSupabase) {
    await supabase.auth.signOut();
  }
  
  // Niezależnie od trybu, czyścimy wszystko, aby zapewnić spójność.
  localStorage.removeItem('token');
  user.set(null);
  session.set(null);
  goto('/login');
}
