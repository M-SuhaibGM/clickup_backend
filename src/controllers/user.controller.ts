import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';

/** GET /api/users/me (protected) */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.getSafeUser(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});
export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await UserService.listUsers();
  res.json({ users });
});