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

// POST /ai/chat  { message, history?: [{ role, content }] }  ->  { reply: string }
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message, history } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  const userId = req.user!.id;
  const [user, tasks] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.task.findMany({
      where: {
        assigneeId: userId,
        // Only tasks in workspaces the user still belongs to
        list: { project: { workspace: { members: { some: { userId } } } } },
      },
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { updatedAt: 'desc' }],
      take: 50,
      select: {
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        list: { select: { name: true, project: { select: { name: true } } } },
      },
    }),
  ]);

  const taskLines = tasks.map(
    (t) =>
      `- ${t.title} | status: ${t.status} | priority: ${t.priority} | due: ${
        t.dueDate ? t.dueDate.toISOString().slice(0, 10) : 'none'
      } | project: ${t.list.project.name} / ${t.list.name}`
  );

  try {
    const reply = await AiService.converse(message, history, {
      userName: user?.name ?? undefined,
      tasks: taskLines,
    });
    res.json({ reply });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
