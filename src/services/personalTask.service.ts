// backend/src/services/personalTask.service.ts
// Private to-dos for the "My Tasks" page. Scoped to (user, workspace); nobody else can see or touch them.
import { prisma } from '../models';
import { WorkspaceModel } from '../models/workspace.model';

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const MAX_TITLE = 200;
const MAX_PER_WORKSPACE = 500;

const cleanTitle = (raw: unknown) => {
  const t = typeof raw === 'string' ? raw.trim() : '';
  if (!t) throw httpError('Task name is required', 400);
  if (t.length > MAX_TITLE) throw httpError(`Task name is too long (max ${MAX_TITLE})`, 400);
  return t;
};

async function requireOwn(id: string, userId: string) {
  const task = await prisma.personalTask.findFirst({ where: { id, userId } });
  if (!task) throw httpError('Task not found', 404);
  return task;
}

export const PersonalTaskService = {
  async list(workspaceId: string, userId: string) {
    if (!(await WorkspaceModel.findByIdAndMember(workspaceId, userId))) throw httpError('Workspace not found or unauthorized', 403);
    return prisma.personalTask.findMany({
      where: { workspaceId, userId },
      orderBy: [{ done: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async create(workspaceId: string, userId: string, input: { title?: unknown }) {
    const title = cleanTitle(input.title);
    if (!(await WorkspaceModel.findByIdAndMember(workspaceId, userId))) throw httpError('Workspace not found or unauthorized', 403);
    if ((await prisma.personalTask.count({ where: { workspaceId, userId } })) >= MAX_PER_WORKSPACE) {
      throw httpError('Your personal list is full — delete some tasks first', 400);
    }
    return prisma.personalTask.create({ data: { title, workspaceId, userId } });
  },

  async update(id: string, userId: string, input: { title?: unknown; done?: unknown }) {
    await requireOwn(id, userId);
    const data: { title?: string; done?: boolean } = {};
    if (input.title !== undefined) data.title = cleanTitle(input.title);
    if (input.done !== undefined) data.done = Boolean(input.done);
    return prisma.personalTask.update({ where: { id }, data });
  },

  async delete(id: string, userId: string) {
    await requireOwn(id, userId);
    await prisma.personalTask.delete({ where: { id } });
  },
};
