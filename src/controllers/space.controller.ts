// backend/src/controllers/space.controller.ts
import { Request, Response } from 'express';
import { SpaceService } from '../services/space.service';
import { ActivityService } from '../services/activity.service';
import { asyncHandler } from '../utils/asyncHandler';

const fail = (res: Response, err: unknown) => {
  const e = err as Error & { status?: number };
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(err); // unexpected (e.g. database) failure — don't leak internals to the client
  res.status(500).json({ error: 'Something went wrong' });
};

export const listSpaces = asyncHandler(async (req: Request, res: Response) => {
  try {
    const spaces = await SpaceService.list(req.params.workspaceId as string, req.user!.id);
    res.json({ spaces });
  } catch (err) { fail(res, err); }
});

export const createSpace = asyncHandler(async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const space = await SpaceService.create(workspaceId, req.user!.id, req.body ?? {});
    await ActivityService.log({
      workspaceId,
      userId: req.user!.id,
      action: 'created',
      entityType: 'space',
      entityName: space.name,
    });
    res.status(201).json({ space });
  } catch (err) { fail(res, err); }
});

export const updateSpace = asyncHandler(async (req: Request, res: Response) => {
  try {
    const space = await SpaceService.update(req.params.id as string, req.user!.id, req.body ?? {});
    if (space) {
      await ActivityService.log({
        workspaceId: space.workspaceId,
        userId: req.user!.id,
        action: 'updated',
        entityType: 'space',
        entityName: space.name,
      });
    }
    res.json({ space });
  } catch (err) { fail(res, err); }
});

export const deleteSpace = asyncHandler(async (req: Request, res: Response) => {
  try {
    const space = await SpaceService.delete(req.params.id as string, req.user!.id);
    await ActivityService.log({
      workspaceId: space.workspaceId,
      userId: req.user!.id,
      action: 'deleted',
      entityType: 'space',
      entityName: space.name,
    });
    res.json({ success: true });
  } catch (err) { fail(res, err); }
});
