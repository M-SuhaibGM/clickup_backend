// backend/src/models/comment.model.ts
import { prisma } from './index';

export const CommentModel = {
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