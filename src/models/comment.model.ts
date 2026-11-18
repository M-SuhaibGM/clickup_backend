// backend/src/models/comment.model.ts
import { prisma } from './index';

export const CommentModel = {
  /**
   * 'assigned'  → every comment on tasks assigned to `userId`
   * 'delegated' → comments `userId` wrote on tasks assigned to someone else
   */
  findForAssignee(workspaceId: string, userId: string, type: 'assigned' | 'delegated') {
    const inWorkspace = { list: { project: { workspaceId } } };
    return prisma.comment.findMany({
      where:
        type === 'assigned'
          ? { task: { assigneeId: userId, ...inWorkspace } }
          : { userId, task: { assigneeId: { not: null }, NOT: { assigneeId: userId }, ...inWorkspace } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            listId: true,
            assignee: { select: { id: true, name: true, avatar: true } },
            list: {
              select: {
                id: true,
                name: true,
                project: { select: { id: true, name: true, color: true } },
              },
            },
          },
        },
      },
    });
  },

  create(taskId: string, userId: string, text: string) {
    return prisma.comment.create({
      data: { taskId, userId, text },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  },
   update(id: string, userId: string, text: string) {
    return prisma.comment.updateMany({
      where: { id, userId }, // Only update if the user owns it
      data: { text },
    });
  },

  delete(id: string, userId: string) {
    return prisma.comment.deleteMany({
      where: { id, userId },
    });
  },
};