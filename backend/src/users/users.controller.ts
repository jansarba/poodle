import {
  Controller,
  Get,
  Body,
  Patch,
  Req,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from './entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req: AuthenticatedRequest): Promise<User> {
    return this.usersService.findOne(req.user.id);
  }

  @Get('me/votes')
  getMyVotes(@Req() req: AuthenticatedRequest) {
    return this.usersService.findVotedPolls(req.user.id);
  }

  @Patch('me')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<User> {
    if (!file) {
      throw new BadRequestException('Avatar file is required.');
    }
    // Jawnie `await` i zwracamy wynik, aby zapewnić, że zwracany typ jest `Promise<User>`
    const updatedUser = await this.usersService.uploadAvatar(req.user.id, file);
    return updatedUser;
  }
}
