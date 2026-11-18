// backend/src/controllers/personalTask.controller.ts
import { Request, Response } from 'express';
import { PersonalTaskService } from '../services/personalTask.service';
import { asyncHandler } from '../utils/asyncHandler';

const fail = (res: Response, err: unknown) => {
  const e = err as Error & { status?: number };
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
};

export const listPersonalTasks = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json({ tasks: await PersonalTaskService.list(req.params.workspaceId as string, req.user!.id) });
  } catch (err) { fail(res, err); }
});

export const createPersonalTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.status(201).json({ task: await PersonalTaskService.create(req.params.workspaceId as string, req.user!.id, req.body ?? {}) });
  } catch (err) { fail(res, err); }
});

export const updatePersonalTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json({ task: await PersonalTaskService.update(req.params.id as string, req.user!.id, req.body ?? {}) });
  } catch (err) { fail(res, err); }
});

export const deletePersonalTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    await PersonalTaskService.delete(req.params.id as string, req.user!.id);
    res.json({ success: true });
  } catch (err) { fail(res, err); }
});
