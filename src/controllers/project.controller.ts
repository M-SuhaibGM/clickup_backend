// backend/src/controllers/project.controller.ts
import { Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { asyncHandler } from '../utils/asyncHandler';

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await ProjectService.list(req.user!.id);
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
    const project = await ProjectService.create(req.user!.id, req.body);
    res.status(201).json({ project });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  try {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const project = await ProjectService.update(projectId, req.user!.id, req.body);
    res.json({ project });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  try {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await ProjectService.delete(projectId, req.user!.id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});