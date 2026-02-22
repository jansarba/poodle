import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithoutRequest } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { passportJwtSecret } from 'jwks-rsa';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  [key: string]: any;
}

export interface ValidatedUserPayload {
  id: string;
  email: string;
}

function buildStrategyOptions(
  configService: ConfigService,
): StrategyOptionsWithoutRequest {
  const useSupabase = configService.get<string>('USE_SUPABASE') === 'true';

  if (useSupabase) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL');
    if (!supabaseUrl) {
      throw new Error(
        'SUPABASE_URL must be defined in .env when USE_SUPABASE is true.',
      );
    }

    return {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
      }),
    };
  }

  const secret = configService.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env file.');
  }

  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    ignoreExpiration: false,
    secretOrKey: secret,
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly useSupabase: boolean;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(buildStrategyOptions(configService));
    this.useSupabase = configService.get<string>('USE_SUPABASE') === 'true';
  }

  async validate(payload: JwtPayload): Promise<ValidatedUserPayload> {
    if (!payload || !payload.sub || !payload.email) {
      this.logger.warn('Invalid JWT payload received', payload);
      throw new UnauthorizedException('Invalid token payload.');
    }

    if (this.useSupabase) {
      const exists = await this.userRepository.existsBy({ id: payload.sub });
      if (!exists) {
        const user = this.userRepository.create({
          id: payload.sub,
          email: payload.email,
        });
        await this.userRepository.save(user);
      }
    }

    return { id: payload.sub, email: payload.email };
  }
}
