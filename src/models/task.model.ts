// backend/src/models/task.model.ts
import { prisma } from './index';

export const TaskModel = {
  findAllByList(listId: string, userId: string) {
    return prisma.task.findMany({
      where: {
        listId,
        list: { project: { workspace: { members: { some: { userId } } } } }
      },
      orderBy: { order: 'asc' },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    });
  },

  findByIdAndMember(id: string, userId: string) {
    return prisma.task.findFirst({
      where: { id, list: { project: { workspace: { members: { some: { userId } } } } } },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        subtasks: { orderBy: { createdAt: 'asc' } },
        list: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
                workspaceId: true // ← ADD THIS
              }
            }
          }
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  create(listId: string, data: any) {
    return prisma.task.create({
      data: { ...data, listId },
      include: {
        list: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
                workspaceId: true // ← ADD THIS
              }
            }
          }
        },
        assignee: { select: { id: true, name: true, avatar: true } },
        subtasks: true,
      },
    });
  },

  update(id: string, userId: string, data: any) {
    return prisma.task.updateMany({
      where: {
        id,
        list: { project: { workspace: { members: { some: { userId } } } } }
      },
      data,
    });
  },

  delete(id: string, userId: string) {
    return prisma.task.deleteMany({
      where: {
        id,
        list: { project: { workspace: { members: { some: { userId } } } } }
      },
    });
  },

  findAllAssignedToUser(workspaceId: string, userId: string) {
    return prisma.task.findMany({
      where: {
        assigneeId: userId,
        parentId: null, // Only show main tasks
        list: {
          project: {
            workspaceId,
          },
        },
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        list: {
          select: {
            id: true,
            name: true,
            project: { select: { id: true, name: true, color: true } },
          },
        },
        subtasks: { select: { id: true, title: true, status: true } },
        comments: { select: { id: true } },
      },
      orderBy: { dueDate: 'asc' }, // Order by closest deadline
    });
  },
  async reorder(taskIds: string[], userId: string) {
    const updates = taskIds.map((id, index) =>
      prisma.task.updateMany({
        where: {
          id,
          list: { project: { workspace: { members: { some: { userId } } } } }
        },
        data: { order: index },
      })
    );
    return prisma.$transaction(updates);
  },
};