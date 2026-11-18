// backend/src/services/timeEntry.service.ts
// Time tracking on tasks. The assignee runs the timer; workspace admins can also log time by hand.
import { prisma } from '../models';
import { TaskModel } from '../models/task.model';
import { WorkspaceModel } from '../models/workspace.model';

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const MAX_MANUAL_MINUTES = 24 * 60;
const MAX_NOTE = 200;
const include = { user: { select: { id: true, name: true, avatar: true } } };

async function requireTask(taskId: string, userId: string) {
  const task = await TaskModel.findByIdAndMember(taskId, userId);
  if (!task) throw httpError('Task not found or unauthorized', 404);
  return task;
}

export const TimeEntryService = {
  /** Starts a timer. A user has one running timer at a time, so any other is stopped first. */
  async start(taskId: string, userId: string) {
    const task = await requireTask(taskId, userId);
    if (task.assigneeId !== userId) throw httpError('Only the person this task is assigned to can start the timer', 403);
    const now = new Date();
    const [, entry] = await prisma.$transaction([
      prisma.timeEntry.updateMany({ where: { userId, endedAt: null }, data: { endedAt: now } }),
      prisma.timeEntry.create({ data: { taskId, userId, startedAt: now }, include }),
    ]);
    return entry;
  },

  async stop(taskId: string, userId: string) {
    await requireTask(taskId, userId);
    const running = await prisma.timeEntry.findFirst({ where: { taskId, userId, endedAt: null } });
    if (!running) throw httpError('No timer is running on this task', 400);
    return prisma.timeEntry.update({ where: { id: running.id }, data: { endedAt: new Date() }, include });
  },

  /**
   * Logs time by hand, either as a duration (`minutes` + optional `date`) or as an explicit
   * `startedAt` / `endedAt` pair.
   */
  async addManual(
    taskId: string,
    userId: string,
    input: { minutes?: unknown; date?: unknown; startedAt?: unknown; endedAt?: unknown; note?: unknown }
  ) {
    const task = await requireTask(taskId, userId);
    if (!(await WorkspaceModel.isAdmin(task.list.project.workspaceId, userId))) {
      throw httpError('Only admins can log time manually', 403);
    }
    const note = typeof input.note === 'string' ? input.note.trim().slice(0, MAX_NOTE) : '';

    let startedAt: Date;
    let endedAt: Date;

    if (input.startedAt && input.endedAt) {
      startedAt = new Date(String(input.startedAt));
      endedAt = new Date(String(input.endedAt));
      if (isNaN(startedAt.getTime()) || isNaN(endedAt.getTime())) throw httpError('Invalid start or end time', 400);
      if (endedAt.getTime() <= startedAt.getTime()) throw httpError('The end time must be after the start time', 400);
      if (endedAt.getTime() > Date.now() + 5 * 60_000) throw httpError('You cannot log time in the future', 400);
      if (endedAt.getTime() - startedAt.getTime() > MAX_MANUAL_MINUTES * 60_000) throw httpError('A single entry can be at most 24 hours', 400);
    } else {
      const minutes = Number(input.minutes);
      if (!Number.isFinite(minutes) || minutes <= 0) throw httpError('Enter a duration greater than zero', 400);
      if (minutes > MAX_MANUAL_MINUTES) throw httpError('A single entry can be at most 24 hours', 400);

      // `date` is the day the work happened; today means "ending now", other days end at midday
      endedAt = new Date();
      if (input.date) {
        const d = new Date(String(input.date));
        if (isNaN(d.getTime())) throw httpError('Invalid date', 400);
        if (d.getTime() > Date.now()) throw httpError('You cannot log time in the future', 400);
        if (d.toDateString() !== new Date().toDateString()) {
          d.setHours(12, 0, 0, 0);
          endedAt = d;
        }
      }
      startedAt = new Date(endedAt.getTime() - Math.round(minutes * 60_000));
    }

    return prisma.timeEntry.create({
      data: { taskId, userId, startedAt, endedAt, manual: true, note: note || null },
      include,
    });
  },

  /** My tracked time in a workspace over the last `days` days (plus any timer still running). */
  async mine(workspaceId: string, userId: string, rawDays: unknown) {
    if (!(await WorkspaceModel.findByIdAndMember(workspaceId, userId))) throw httpError('Workspace not found or unauthorized', 403);
    const days = Math.min(31, Math.max(1, Math.floor(Number(rawDays)) || 7));
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));
    return prisma.timeEntry.findMany({
      where: {
        userId,
        task: { list: { project: { workspaceId } } },
        OR: [{ endedAt: null }, { endedAt: { gte: since } }],
      },
      orderBy: { startedAt: 'desc' },
      take: 1000,
      select: {
        id: true, taskId: true, startedAt: true, endedAt: true,
        task: { select: { title: true, list: { select: { project: { select: { name: true, color: true } } } } } },
      },
    });
  },

  /** The person who logged it, or a workspace admin, can delete an entry. */
  async delete(entryId: string, userId: string) {
    const entry = await prisma.timeEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw httpError('Time entry not found', 404);
    const task = await requireTask(entry.taskId, userId);
    if (entry.userId !== userId && !(await WorkspaceModel.isAdmin(task.list.project.workspaceId, userId))) {
      throw httpError('Only the person who logged it or an admin can delete this entry', 403);
    }
    await prisma.timeEntry.delete({ where: { id: entryId } });
    return entry;
  },
};
