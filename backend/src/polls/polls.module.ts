import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Poll } from './entities/poll.entity';
import { Vote } from '../votes/entities/vote.entity';
import { User } from '../users/entities/user.entity';
import { VotesModule } from '../votes/votes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Poll, Vote, User]), VotesModule],
  controllers: [PollsController],
  providers: [PollsService],
})
export class PollsModule {}
