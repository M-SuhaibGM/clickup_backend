// backend/src/controllers/ai.controller.ts
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AiService } from '../services/ai.service';
import { TaskService } from '../services/task.service';
import { prisma } from '../models';

// POST /ai/subtasks  { title, description? }  ->  { subtasks: string[] }
export const suggestSubtasks = asyncHandler(async (req: Request, res: Response) => {
  const { title, description } = req.body ?? {};
  try {
    const subtasks = await AiService.generateSubtasks(title, description);
    res.json({ subtasks });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /ai/draft  { prompt }  ->  { tasks: [{ title, description, priority }] }
export const draftTasks = asyncHandler(async (req: Request, res: Response) => {
  const { prompt } = req.body ?? {};
  try {
    const tasks = await AiService.draftTasks(prompt);
    res.json({ tasks });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /ai/summarize  { taskId }  ->  { summary: string }
export const summarizeTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.body ?? {};
  if (!taskId) return res.status(400).json({ error: 'taskId is required' });

  // Membership / access check — returns null if the user can't see this task
  const task = await TaskService.getOne(taskId as string, req.user!.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const comments = await prisma.comment.findMany({
    where: { taskId: taskId as string },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { name: true } } },
  });

  try {
    const summary = await AiService.summarizeComments(
      comments.map((c) => ({ author: c.user?.name || 'User', text: c.text }))
    );
    res.json({ summary });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
