import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  NotFoundException,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { CreateVoteDto } from '../votes/dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createPollDto: CreatePollDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pollsService.create(createPollDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.pollsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const poll = await this.pollsService.findOneWithVotes(id);
    if (!poll) throw new NotFoundException(`Poll with ID "${id}" not found`);
    return poll;
  }

  @Post(':id/votes')
  @UseGuards(new JwtAuthGuard({ passthrough: true }))
  @HttpCode(HttpStatus.CREATED)
  addVote(
    @Param('id', ParseUUIDPipe) pollId: string,
    @Body() createVoteDto: CreateVoteDto,
    @Req() req: Partial<AuthenticatedRequest>,
  ) {
    return this.pollsService.addVote(pollId, createVoteDto, req.user?.id);
  }
}
