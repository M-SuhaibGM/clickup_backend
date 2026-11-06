// backend/src/controllers/task.controller.ts
import { Request, Response } from 'express';
import { TaskService } from '../services/task.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getIO } from '../config/socket';
import { EmailService } from '../services/email.service';
import { prisma } from '../models';
import { TaskModel } from '../models/task.model';
import { ActivityService } from '../services/activity.service'; // ← Import

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    const task = await TaskService.create(req.params.listId as string, req.user!.id, req.body);
    const io = getIO();

    io.to(`project:${task.list.project.id}`).emit('task:created', task);

    // ─── LOG ACTIVITY ───
    await ActivityService.log({
      workspaceId: task.list.project.workspaceId,
      userId: req.user!.id,
      action: 'created',
      entityType: 'task',
      entityName: task.title,
    });

    res.status(201).json({ task });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    const existingTask = await TaskModel.findByIdAndMember(req.params.id as string, req.user!.id);
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    const previousAssigneeId = existingTask.assigneeId;

    const task = await TaskService.update(req.params.id as string, req.user!.id, req.body);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const io = getIO();
    io.to(`project:${task.list.project.id}`).emit('task:updated', task);

    // ─── LOG ACTIVITY ───
    await ActivityService.log({
      workspaceId: task.list.project.workspaceId,
      userId: req.user!.id,
      action: 'updated',
      entityType: 'task',
      entityName: task.title,
    });

    const newAssigneeId = task.assigneeId;
    const assigneeChanged = newAssigneeId && newAssigneeId !== previousAssigneeId;

    if (assigneeChanged && task.assignee?.email) {
      const taskUrl = `http://localhost:3000/tasks/${task.id}`; // ← Updated to new route

      EmailService.sendTaskAssignedEmail(
        task.assignee.email,
        task.assignee.name,
        task.title,
        taskUrl,
        task.list.project.name || 'Workspace'
      );
    }

    res.json({ task });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  try {
    const task = await TaskService.getOne(req.params.id as string, req.user!.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await TaskService.delete(req.params.id as string, req.user!.id);
    const io = getIO();

    io.to(`project:${task.list.project.id}`).emit('task:deleted', {
      id: task.id,
      listId: task.listId
    });

    // ─── LOG ACTIVITY ───
    await ActivityService.log({
      workspaceId: task.list.project.workspaceId,
      userId: req.user!.id,
      action: 'deleted',
      entityType: 'task',
      entityName: task.title,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const tasks = await TaskService.listByList(req.params.listId as string, req.user!.id);
  res.json({ tasks });
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await TaskService.getOne(req.params.id as string, req.user!.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

export const reorderTasks = asyncHandler(async (req: Request, res: Response) => {
  const { taskIds } = req.body;
  if (!Array.isArray(taskIds)) {
    return res.status(400).json({ error: 'taskIds must be an array' });
  }

  await TaskService.reorder(taskIds, req.user!.id);
  res.json({ success: true });
});

export const listMyTasks = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const tasks = await TaskService.listAssignedToUser(workspaceId as string, req.user!.id);
  res.json({ tasks });
});

export const getPendingTaskCount = asyncHandler(async (req: Request, res: Response) => {
  const { workspaceId } = req.params;
  const userId = req.user!.id;

  const count = await prisma.task.count({
    where: {
      assigneeId: userId,
      status: { not: 'DONE' },
      parentId: null,
      list: { project: { workspaceId: workspaceId as string } },
    },
  });

  res.json({ count });
});