import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_CLIENT = 'SUPABASE_CLIENT';

export const SupabaseProvider: Provider = {
  provide: SUPABASE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): SupabaseClient | null => {
    const useSupabase = configService.get<string>('USE_SUPABASE') === 'true';

    if (useSupabase) {
      const supabaseUrl = configService.get<string>('SUPABASE_URL');
      const supabaseServiceKey = configService.get<string>(
        'SUPABASE_SERVICE_KEY',
      );

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
          'Zmienne środowiskowe SUPABASE_URL lub SUPABASE_SERVICE_KEY nie są ustawione.',
        );
      }

      // Tworzymy i zwracamy klienta Supabase z kluczem serwisowym,
      // który ma uprawnienia do operacji na storage.
      return createClient(supabaseUrl, supabaseServiceKey);
    }

    // W trybie lokalnym, gdzie Supabase nie jest używane, zwracamy null.
    return null;
  },
};
