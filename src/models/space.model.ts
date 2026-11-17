// backend/src/models/space.model.ts
import { prisma } from './index';

const memberOf = (userId: string) => ({ workspace: { members: { some: { userId } } } });

export const SpaceModel = {
  findAllByWorkspace(workspaceId: string, userId: string) {
    return prisma.space.findMany({
      where: { workspaceId, ...memberOf(userId) },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { projects: true } } },
    });
  },

  findByIdAndMember(id: string, userId: string) {
    return prisma.space.findFirst({
      where: { id, ...memberOf(userId) },
      include: { _count: { select: { projects: true } } },
    });
  },

  async create(workspaceId: string, data: { name: string; color?: string; icon?: string | null; description?: string | null }) {
    const last = await prisma.space.findFirst({
      where: { workspaceId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    return prisma.space.create({
      data: { ...data, workspaceId, order: (last?.order ?? -1) + 1 },
      include: { _count: { select: { projects: true } } },
    });
  },

  update(
    id: string,
    userId: string,
    data: { name?: string; color?: string; icon?: string | null; description?: string | null }
  ) {
    return prisma.space.updateMany({ where: { id, ...memberOf(userId) }, data });
  },

  delete(id: string, userId: string) {
    return prisma.space.deleteMany({ where: { id, ...memberOf(userId) } });
  },
};
