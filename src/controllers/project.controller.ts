// backend/src/controllers/project.controller.ts
import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ActivityService } from '../services/activity.service'; // ← Import

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const workspaceId = req.params.workspaceId as string;
  const projects = await ProjectService.list(workspaceId, req.user!.id);
  res.json({ projects });
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = await ProjectService.getOne(projectId, req.user!.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project });
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const project = await ProjectService.create(workspaceId, req.user!.id, req.body);

    // ─── LOG ACTIVITY ───
    await ActivityService.log({
      workspaceId,
      userId: req.user!.id,
      action: 'created',
      entityType: 'project',
      entityName: project.name,
    });

    res.status(201).json({ project });
  } catch (err) {
    const message = (err as Error).message;
    const status = message.includes('admin') ? 403 : 400;
    res.status(status).json({ error: message });
  }
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  try {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const project = await ProjectService.update(projectId, req.user!.id, req.body);

    // ─── LOG ACTIVITY ───
    if (project) {
      // We need workspaceId — ProjectService.getOne returns the full project with workspaceId
      const workspaceId = (project as any).workspaceId;
      await ActivityService.log({
        workspaceId,
        userId: req.user!.id,
        action: 'updated',
        entityType: 'project',
        entityName: project.name,
      });
    }

    res.json({ project });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  try {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    // Fetch first to get name + workspaceId for the log
    const project = await ProjectService.getOne(projectId, req.user!.id);
    
    await ProjectService.delete(projectId, req.user!.id);

    // ─── LOG ACTIVITY ───
    if (project) {
      const workspaceId = (project as any).workspaceId;
      await ActivityService.log({
        workspaceId,
        userId: req.user!.id,
        action: 'deleted',
        entityType: 'project',
        entityName: project.name,
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});