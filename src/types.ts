import { Request } from 'express';


export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
