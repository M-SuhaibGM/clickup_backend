// backend/src/controllers/list.controller.ts
import { Request, Response } from 'express';
import { ListService } from '../services/list.service';
import { asyncHandler } from '../utils/asyncHandler';

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
    res.status(201).json({ list });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const updateList = asyncHandler(async (req: Request, res: Response) => {
  try {
    const list = await ListService.update(req.params.id as string, req.user!.id, req.body);
    res.json({ list });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export const deleteList = asyncHandler(async (req: Request, res: Response) => {
  try {
    await ListService.delete(req.params.id as string, req.user!.id);
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