import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poll } from './entities/poll.entity';
import { CreatePollDto } from './dto/create-poll.dto';
import { Vote } from '../votes/entities/vote.entity';
import { CreateVoteDto } from '../votes/dto/create-vote.dto';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Poll)
    private readonly pollsRepository: Repository<Poll>,
    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,
  ) {}

  create(createPollDto: CreatePollDto, userId: string): Promise<Poll> {
    const poll = this.pollsRepository.create({
      ...createPollDto,
      userId,
    });
    return this.pollsRepository.save(poll);
  }

  findAll(): Promise<Poll[]> {
    return this.pollsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  findOneWithVotes(id: string): Promise<Poll | null> {
    return this.pollsRepository.findOne({
      where: { id },
      relations: {
        votes: true, // Dołącz powiązane głosy
      },
    });
  }

  async addVote(
    pollId: string,
    createVoteDto: CreateVoteDto,
    userId?: string,
  ): Promise<Vote> {
    const poll = await this.findOneWithVotes(pollId);
    if (!poll) {
      throw new NotFoundException(`Poll with ID "${pollId}" not found.`);
    }

    // 1. Weryfikacja slotów
    for (const slot of createVoteDto.selectedTimeSlots) {
      if (!poll.timeSlots.includes(slot)) {
        throw new NotFoundException(
          `Time slot "${slot}" is not valid for this poll.`,
        );
      }
    }

    // 2. Sprawdzenie, czy ten user/imię już głosował
    if (userId) {
      const existingVote = poll.votes.find((v) => v.userId === userId);
      if (existingVote) {
        throw new Error('User has already voted in this poll.');
      }
    } else if (createVoteDto.voterName) {
      const nameUsed = poll.votes.find(
        (v) =>
          v.voterName &&
          createVoteDto.voterName &&
          v.voterName.toLowerCase() === createVoteDto.voterName.toLowerCase(),
      );
      if (nameUsed) {
        throw new Error(
          'This name has already been used to vote in this poll.',
        );
      }
    }

    // 3. Utworzenie głosu
    const newVote = this.votesRepository.create({
      ...createVoteDto,
      poll,
      userId: userId ?? null,
    });

    return this.votesRepository.save(newVote);
  }
}
