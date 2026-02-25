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
          'SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.',
        );
      }

      // Service key grants storage access
      return createClient(supabaseUrl, supabaseServiceKey);
    }

    // Local mode — no Supabase client needed
    return null;
  },
};
