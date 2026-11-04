// backend/src/models/task.model.ts
import { prisma } from './index';

export const TaskModel = {
  findAllByList(listId: string, ownerId: string) {
    return prisma.task.findMany({
      where: { listId, ownerId },
      orderBy: { order: 'asc' }, // ← Changed to order
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    });
  },
  
  // ... keep findById, create (add order: 0), update, delete ...

  async reorder(taskIds: string[], ownerId: string) {
    const updates = taskIds.map((id, index) =>
      prisma.task.updateMany({
        where: { id, ownerId },
        data: { order: index },
      })
    );
    return prisma.$transaction(updates);
  },

  findByIdAndOwner(id: string, ownerId: string) {
    return prisma.task.findFirst({
      where: { id, ownerId }, // ← Updated
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        subtasks: { orderBy: { createdAt: 'asc' } },
        list: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
      },
    });
  },

  create(listId: string, ownerId: string, data: { // ← Added ownerId parameter
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: Date;
    assigneeId?: string;
  }) {
    return prisma.task.create({
      data: { ...data, listId, ownerId }, // ← Added ownerId
      include: { assignee: { select: { id: true, name: true, avatar: true } } },
    });
  },

  update(id: string, ownerId: string, data: any) {
    return prisma.task.updateMany({
      where: { id, ownerId }, // ← Updated
      data,
    });
  },

  delete(id: string, ownerId: string) {
    return prisma.task.deleteMany({
      where: { id, ownerId }, // ← Updated
    });
  },
};