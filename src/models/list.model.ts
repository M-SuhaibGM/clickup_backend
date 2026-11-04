// backend/src/models/list.model.ts
import { prisma } from './index';

export const ListModel = {
  findAllByProject(projectId: string, ownerId: string) {
    return prisma.list.findMany({
      where: { projectId, ownerId },
      orderBy: { order: 'asc' }, // ← Changed from name/createdAt to order
      include: { _count: { select: { tasks: true } } },
    });
  },
  // ... keep findById, create (add order: 0 by default), update, delete ...

  async reorder(listIds: string[], ownerId: string) {
    // Update each list's order based on its index in the array
    const updates = listIds.map((id, index) =>
      prisma.list.updateMany({
        where: { id, ownerId },
        data: { order: index },
      })
    );
    return prisma.$transaction(updates);
  },


  findByIdAndOwner(id: string, ownerId: string) {
    return prisma.list.findFirst({
      where: { id, ownerId },
      include: {
        project: { select: { id: true, name: true, color: true, ownerId: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
  },



  create(projectId: string, ownerId: string, data: { name: string }) {
    return prisma.list.create({
      data: {
        name: data.name,
        projectId,
        ownerId, // ← ADDED
      },
      include: { _count: { select: { tasks: true } } },
    });
  },

  update(id: string, ownerId: string, data: { name?: string }) {
    return prisma.list.updateMany({
      where: { id, ownerId },
      data,
    });
  },

  delete(id: string, ownerId: string) {
    return prisma.list.deleteMany({
      where: { id, ownerId },
    });
  },
};