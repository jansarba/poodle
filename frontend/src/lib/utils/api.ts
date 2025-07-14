import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { session } from '$lib/stores/authStore';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true';

type Fetch = typeof window.fetch;

export async function api(
  path: string,
  options: RequestInit = {},
  customFetch: Fetch = fetch
) {
  const headers = new Headers(options.headers || {});
  
  if (browser) {
    let token: string | null = null;
    
    if (useSupabase) {
      const supabaseSession = get(session);
      token = supabaseSession?.access_token ?? null;
    } else {
      token = localStorage.getItem('token');
    }
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
  }

  const response = await customFetch(`${API_URL}/${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    console.error(`API Error on path: ${path}`, { status: response.status, errorData });
    throw new Error(errorData.message || 'API request failed');
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}
