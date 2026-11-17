import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { asyncHandler } from '../utils/asyncHandler';

/** GET /api/users/me (protected) */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.getSafeUser(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});
/** PATCH /api/users/me (protected) */
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, avatar } = req.body ?? {};
  try {
    const user = await UserService.updateProfile(req.user!.id, { name, email, password, avatar });
    res.json({ user });
  } catch (err: any) {
    if (err?.status) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});
export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await UserService.listUsers();
  res.json({ users });
});