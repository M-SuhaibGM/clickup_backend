// backend/src/controllers/task.controller.ts
import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { asyncHandler } from '../utils/asyncHandler';

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await TaskService.listByList(req.params.listId as string, req.user!.id);
  res.json({ tasks });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await TaskService.getOne(req.params.id as string, req.user!.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    const task = await TaskService.create(req.params.listId as string, req.user!.id, req.body);
    res.status(201).json({ task });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    const task = await TaskService.update(req.params.id as string, req.user!.id, req.body);
    res.json({ task });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    await TaskService.delete(req.params.id as string, req.user!.id);
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// backend/src/controllers/task.controller.ts

export const reorderTasks = asyncHandler(async (req: Request, res: Response) => {
  const { taskIds } = req.body;
  if (!Array.isArray(taskIds)) {
    return res.status(400).json({ error: 'taskIds must be an array' });
  }

  // Call the service to update the order in the database
  await TaskService.reorder(taskIds, req.user!.id);

  res.json({ success: true });
});