import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  [key: string]: any;
}

export interface ValidatedUserPayload {
  id: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const useSupabase = configService.get<string>('USE_SUPABASE') === 'true';
    const secret = useSupabase
      ? (configService.get<string>('SUPABASE_JWT_SECRET') ??
        configService.get<string>('JWT_SECRET'))
      : configService.get<string>('JWT_SECRET');

    if (!secret) {
      const keyName = useSupabase
        ? 'SUPABASE_JWT_SECRET (or JWT_SECRET)'
        : 'JWT_SECRET';
      throw new Error(
        `JWT secret key (${keyName}) is not defined in .env file.`,
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async validate(payload: JwtPayload): Promise<ValidatedUserPayload> {
    if (!payload || !payload.sub || !payload.email) {
      this.logger.warn('Invalid JWT payload received', payload);
      throw new UnauthorizedException('Invalid token payload.');
    }
    // Zwracam uproszczony obiekt, który będzie dołączony do `req.user`
    return { id: payload.sub, email: payload.email };
  }
}
