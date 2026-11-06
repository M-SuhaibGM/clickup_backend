// backend/src/controllers/activity.controller.ts
import { Request, Response } from 'express';
import { ActivityService } from '../services/activity.service';
import { WorkspaceService } from '../services/workspace.service';
import { asyncHandler } from '../utils/asyncHandler';

export const getWorkspaceActivities = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  // Verify user is an Admin in the workspace
  const workspace = await WorkspaceService.getOne(workspaceId as string, userId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

  const me = workspace.members.find(m => m.userId === userId);
  if (me?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can view activity history' });
  }

  const activities = await ActivityService.list(workspaceId as string) ;
  res.json({ activities });
});