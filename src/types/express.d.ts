import { SafeUser } from '../services/auth.service';

declare global {
  namespace Express {
    interface User extends SafeUser {}
    interface Request {
      user?: SafeUser;
    }
  }
}

export {};