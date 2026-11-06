import { Request, Response } from 'express';
import { ListService } from '../services/list.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ActivityService } from '../services/activity.service'; // ← Import
import { prisma } from '../models'; // ← Import prisma

export const listByProject = asyncHandler(async (req: Request, res: Response) => {
  const lists = await ListService.listByProject(req.params.projectId as string, req.user!.id);
  res.json({ lists });
});

export const getList = asyncHandler(async (req: Request, res: Response) => {
  const list = await ListService.getOne(req.params.id as string, req.user!.id);
  if (!list) return res.status(404).json({ error: 'List not found' });
  res.json({ list });
});

export const createList = asyncHandler(async (req: Request, res: Response) => {
  try {
    const list = await ListService.create(req.params.projectId as string, req.user!.id, req.body);
    
    // ─── LOG ACTIVITY ───
    const project = await prisma.project.findUnique({ 
      where: { id: req.params.projectId  as string}, 
      select: { workspaceId: true } 
    });
    if (project) {
      await ActivityService.log({
        workspaceId: project.workspaceId,
        userId: req.user!.id,
        action: 'created',
        entityType: 'list',
        entityName: list.name,
      });
    }

    res.status(201).json({ list });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const updateList = asyncHandler(async (req: Request, res: Response) => {
  try {
    const list = await ListService.update(req.params.id as string, req.user!.id, req.body);
    
    // ─── LOG ACTIVITY ───
    const dbList = await prisma.list.findUnique({ 
      where: { id: req.params.id  as string}, 
      include: { project: { select: { workspaceId: true } } } 
    });
    if (dbList) {
      await ActivityService.log({
        workspaceId: dbList.project.workspaceId as string,
        userId: req.user!.id,
        action: 'updated',
        entityType: 'list',
        entityName: dbList.name,
      });
    }

    res.json({ list });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export const deleteList = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Fetch list first to get its name and workspace ID for the log
    const dbList = await prisma.list.findUnique({ 
      where: { id: req.params.id  as string}, 
      include: { project: { select: { workspaceId: true } } } 
    });

    await ListService.delete(req.params.id as string, req.user!.id);
    
    // ─── LOG ACTIVITY ───
    if (dbList) {
      await ActivityService.log({
        workspaceId: dbList.project.workspaceId as string,
        userId: req.user!.id,
        action: 'deleted',
        entityType: 'list',
        entityName: dbList.name,
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export const reorderLists = asyncHandler(async (req: Request, res: Response) => {
  const { listIds } = req.body;
  if (!Array.isArray(listIds)) return res.status(400).json({ error: 'listIds must be an array' });
  
  await ListService.reorder(listIds, req.user!.id);
  res.json({ success: true });
});