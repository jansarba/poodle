import { Request } from 'express';
import { ValidatedUserPayload } from '../auth/jwt.strategy';

export interface AuthenticatedRequest extends Request {
  user: ValidatedUserPayload;
}
