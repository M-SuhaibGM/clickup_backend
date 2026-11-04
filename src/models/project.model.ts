// backend/src/models/project.model.ts
import { prisma } from './index';

export const ProjectModel = {
  findAllByOwner(ownerId: string) {
    return prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { lists: true } } },
    });
  },

  findByIdAndOwner(id: string, ownerId: string) {
    return prisma.project.findFirst({
      where: { id, ownerId },
      include: {
        lists: { orderBy: { name: 'asc' } },
      },
    });
  },

  create(ownerId: string, data: { name: string; description?: string; color?: string }) {
    return prisma.project.create({
      data: { ...data, ownerId },
    });
  },

  update(id: string, ownerId: string, data: { name?: string; description?: string; color?: string }) {
    // updateMany with ownerId guard ensures you can't update someone else's project
    return prisma.project.updateMany({
      where: { id, ownerId },
      data,
    });
  },

  delete(id: string, ownerId: string) {
    return prisma.project.deleteMany({
      where: { id, ownerId },
    });
  },
};