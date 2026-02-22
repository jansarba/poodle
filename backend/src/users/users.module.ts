import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Vote } from '../votes/entities/vote.entity';
import { SupabaseProvider } from '../supabase/supabase.provider';

@Module({
  imports: [TypeOrmModule.forFeature([User, Vote])],
  controllers: [UsersController],
  // Wstrzykujemy nasz serwis oraz warunkowego dostawcę Supabase.
  providers: [UsersService, SupabaseProvider],
  exports: [UsersService],
})
export class UsersModule {}
