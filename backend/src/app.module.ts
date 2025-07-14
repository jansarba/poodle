import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Poll } from './polls/entities/poll.entity';
import { Vote } from './votes/entities/vote.entity';
import { AuthModule } from './auth/auth.module';
import { PollsModule } from './polls/polls.module';
import { UsersModule } from './users/users.module';
import { VotesModule } from './votes/votes.module';

// Dodaj ten import do parsowania stringa połączeniowego
import { parse as parsePgConnectionString } from 'pg-connection-string';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const useSupabase =
          configService.get<string>('USE_SUPABASE') === 'true';

        if (useSupabase) {
          // --- KONFIGURACJA DLA SUPABASE Z LOGOWANIEM ---
          const databaseUrl = configService.get<string>('DATABASE_URL');
          if (!databaseUrl) {
            throw new Error(
              'DATABASE_URL must be set in .env when using Supabase.',
            );
          }

          // --- SEKCJA DEBUGOWANIA ---
          try {
            const parsedConfig = parsePgConnectionString(databaseUrl);

            console.log('--- [DEBUG] PARSED DATABASE URL ---');
            console.log('Original URL       :', databaseUrl);
            console.log('Parsed Host        :', parsedConfig.host);
            console.log('Parsed Port        :', parsedConfig.port);
            console.log('Parsed User        :', parsedConfig.user);
            console.log('Parsed Database    :', parsedConfig.database);
            console.log('-----------------------------------');
          } catch (error) {
            console.error(
              '--- [DEBUG] FAILED TO PARSE DATABASE URL ---',
              error,
            );
          }
          // --- KONIEC SEKCJI DEBUGOWANIA ---

          // Przekazujemy oryginalny URL dalej do TypeORM
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Poll, Vote],
            synchronize: true,
            ssl: { rejectUnauthorized: false },
          };
        } else {
          // --- KONFIGURACJA LOKALNA (bez zmian) ---
          console.log('--- [DEBUG] Using LOCAL database configuration ---');
          return {
            type: 'postgres',
            host: configService.get<string>('POSTGRES_HOST'),
            port: configService.get<number>('POSTGRES_PORT'),
            username: configService.get<string>('POSTGRES_USER'),
            password: configService.get<string>('POSTGRES_PASSWORD'),
            database: configService.get<string>('POSTGRES_DB'),
            entities: [User, Poll, Vote],
            synchronize: true,
            ssl: false, // SSL wyłączone
          };
        }
      },
    }),
    PollsModule,
    VotesModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
