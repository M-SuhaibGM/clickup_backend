// backend/src/controllers/timeEntry.controller.ts
import { Request, Response } from 'express';
import { TimeEntryService } from '../services/timeEntry.service';
import { asyncHandler } from '../utils/asyncHandler';

const fail = (res: Response, err: unknown) => {
  const e = err as Error & { status?: number };
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
};

export const myTime = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json({ entries: await TimeEntryService.mine(req.params.workspaceId as string, req.user!.id, req.query.days) });
  } catch (err) { fail(res, err); }
});

export const startTimer = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.status(201).json({ entry: await TimeEntryService.start(req.params.taskId as string, req.user!.id) });
  } catch (err) { fail(res, err); }
});

export const stopTimer = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json({ entry: await TimeEntryService.stop(req.params.taskId as string, req.user!.id) });
  } catch (err) { fail(res, err); }
});

export const addTime = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.status(201).json({ entry: await TimeEntryService.addManual(req.params.taskId as string, req.user!.id, req.body ?? {}) });
  } catch (err) { fail(res, err); }
});

export const deleteTime = asyncHandler(async (req: Request, res: Response) => {
  try {
    await TimeEntryService.delete(req.params.entryId as string, req.user!.id);
    res.json({ success: true });
  } catch (err) { fail(res, err); }
});
