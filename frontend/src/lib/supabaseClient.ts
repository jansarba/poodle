import {
  createClient,
  type SupabaseClient,
  AuthError,
  type PostgrestSingleResponse
} from '@supabase/supabase-js';
import { browser } from '$app/environment';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useSupabase     = import.meta.env.VITE_USE_SUPABASE === 'true';

const DISABLED_MSG = 'Supabase is disabled in local mode.';

/* ───────────────────── Dummy client (Proxy) ──────────────────── */
const createDummyClient = (): SupabaseClient => {
  /* jeden wspólny błąd AuthError */
  const authError = new AuthError(DISABLED_MSG, 0, 'LOCAL_MODE');

  /* minimalistyczny zestaw metod auth */
  const dummyAuth = {
    signInWithPassword: () =>
      Promise.resolve({ data: { user: null, session: null }, error: authError }),
    signUp: () =>
      Promise.resolve({ data: { user: null, session: null }, error: authError }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () =>
      Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => void 0 } }
    })
  };

  /* prosty query-builder zwracany przez from() */
  const dummyQuery = {
    select: () =>
      Promise.resolve({ data: null, error: { message: DISABLED_MSG } } as PostgrestSingleResponse<null>),
    insert: () =>
      Promise.resolve({ data: null, error: { message: DISABLED_MSG } } as PostgrestSingleResponse<null>),
    update: () =>
      Promise.resolve({ data: null, error: { message: DISABLED_MSG } } as PostgrestSingleResponse<null>),
    delete: () =>
      Promise.resolve({ data: null, error: { message: DISABLED_MSG } } as PostgrestSingleResponse<null>)
  };

  /* proxy przechwytujący wywołania właściwości */
  const handler: ProxyHandler<object> = {
    get(_target, prop: string | symbol) {
      switch (prop) {
        case 'auth':
          return dummyAuth;
        case 'from':
          return () => dummyQuery;
        /* niezaimplementowane funkcje informują dewelopera */
        case 'storage':
        case 'rpc':
        case 'realtime':
          return () => {
            throw new Error(
              `The '${String(prop)}' feature is not implemented in the dummy Supabase client.`
            );
          };
        default:
          return undefined;
      }
    }
  };

  return new Proxy({}, handler) as SupabaseClient;
};

export const supabase: SupabaseClient =
  browser && useSupabase && supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createDummyClient();