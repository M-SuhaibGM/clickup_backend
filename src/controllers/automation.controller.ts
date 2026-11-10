// backend/src/controllers/automation.controller.ts
import { Request, Response } from 'express';
import { AutomationService } from '../services/automation.service';
import { WorkspaceService } from '../services/workspace.service';
import { asyncHandler } from '../utils/asyncHandler';

export const listAutomations = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  
  const ws = await WorkspaceService.getOne(workspaceId, req.user!.id);
  const me = ws?.members.find(m => m.userId === req.user!.id);
  if (me?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

  const automations = await AutomationService.list(workspaceId);
  res.json({ automations });
});

export const createAutomation = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const ws = await WorkspaceService.getOne(workspaceId, req.user!.id);
  const me = ws?.members.find(m => m.userId === req.user!.id);
  if (me?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

  const { trigger, action, actionValue } = req.body;
  if (!trigger || !action) return res.status(400).json({ error: 'Trigger and action required' });

  const automation = await AutomationService.create(workspaceId, { trigger, action, actionValue });
  res.status(201).json({ automation });
});

export const deleteAutomation = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const ws = await WorkspaceService.getOne(workspaceId, req.user!.id);
  const me = ws?.members.find(m => m.userId === req.user!.id);
  if (me?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

  await AutomationService.delete(req.params.id as string, workspaceId);
  res.json({ success: true });
});