// backend/src/controllers/team.controller.ts
import { Request, Response } from 'express';
import { TeamService } from '../services/team.service';
import { ActivityService } from '../services/activity.service';
import { asyncHandler } from '../utils/asyncHandler';

const fail = (res: Response, err: unknown) => {
  const e = err as Error & { status?: number };
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
};

export const listTeams = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json({ teams: await TeamService.list(req.params.workspaceId as string, req.user!.id) });
  } catch (err) { fail(res, err); }
});

export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const team = await TeamService.create(workspaceId, req.user!.id, req.body ?? {});
    await ActivityService.log({ workspaceId, userId: req.user!.id, action: 'created', entityType: 'team', entityName: team.name });
    res.status(201).json({ team });
  } catch (err) { fail(res, err); }
});

export const updateTeam = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json({ team: await TeamService.update(req.params.id as string, req.user!.id, req.body ?? {}) });
  } catch (err) { fail(res, err); }
});

export const deleteTeam = asyncHandler(async (req: Request, res: Response) => {
  try {
    const team = await TeamService.delete(req.params.id as string, req.user!.id);
    await ActivityService.log({ workspaceId: team.workspaceId, userId: req.user!.id, action: 'deleted', entityType: 'team', entityName: team.name });
    res.json({ success: true });
  } catch (err) { fail(res, err); }
});

export const addTeamMember = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json({ team: await TeamService.addMember(req.params.id as string, req.user!.id, req.body?.userId) });
  } catch (err) { fail(res, err); }
});

export const removeTeamMember = asyncHandler(async (req: Request, res: Response) => {
  try {
    res.json({ team: await TeamService.removeMember(req.params.id as string, req.user!.id, req.params.userId as string) });
  } catch (err) { fail(res, err); }
});
