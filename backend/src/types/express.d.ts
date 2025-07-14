import { ValidatedUserPayload } from '../auth/jwt.strategy';

declare global {
  namespace Express {
    interface Request {
      user?: ValidatedUserPayload;
    }
  }
}
