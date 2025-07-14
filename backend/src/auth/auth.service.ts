import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly useSupabase: boolean;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.useSupabase =
      this.configService.get<string>('USE_SUPABASE') === 'true';

    this.logger.log(
      `AuthService initialized in ${this.useSupabase ? 'Supabase' : 'Local'} mode.`,
    );
  }

  private async generateToken(user: User): Promise<{ token: string }> {
    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);
    return { token };
  }

  async login(email: string, password: string): Promise<{ token: string }> {
    if (this.useSupabase) {
      throw new BadRequestException(
        'Local login is disabled when Supabase is active.',
      );
    }

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password'],
    });

    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.generateToken(user);
  }

  async register(email: string, password: string): Promise<{ token: string }> {
    if (this.useSupabase) {
      throw new BadRequestException(
        'Local registration is disabled when Supabase is active.',
      );
    }

    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      id: uuidv4(),
      email,
      password: hashedPassword,
    });

    await this.userRepository.save(newUser);

    return this.generateToken(newUser);
  }
}
