// backend/src/services/comment.service.ts
import { CommentModel } from '../models/comment.model';
import { TaskModel } from '../models/task.model';
import { WorkspaceModel } from '../models/workspace.model';
import { prisma } from '../models';

export const CommentService = {
  async create(taskId: string, userId: string, text: string) {
    if (!text.trim()) throw new Error('Comment cannot be empty');

    // FIXED: Using findByIdAndMember to check workspace access
    const task = await TaskModel.findByIdAndMember(taskId, userId);
    if (!task) throw new Error('Task not found or unauthorized');

    return CommentModel.create(taskId, userId, text.trim());
  },

  async update(commentId: string, userId: string, text: string) {
    if (!text.trim()) throw new Error('Comment cannot be empty');
    const result = await CommentModel.update(commentId, userId, text.trim());
    if (result.count === 0) throw new Error('Comment not found or unauthorized');
    return result;
  },

  /** The task's assignee, the comment's author, or an admin can mark a comment resolved / reopen it. */
  async setResolved(commentId: string, userId: string, resolved: boolean) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error('Comment not found');
    const task = await TaskModel.findByIdAndMember(comment.taskId, userId);
    if (!task) throw new Error('Comment not found or unauthorized');
    const allowed =
      task.assigneeId === userId ||
      comment.userId === userId ||
      (await WorkspaceModel.isAdmin(task.list.project.workspaceId, userId));
    if (!allowed) throw new Error('Only the assignee, the author or an admin can resolve this comment');
    return prisma.comment.update({ where: { id: commentId }, data: { resolvedAt: resolved ? new Date() : null } });
  },

  async delete(commentId: string, userId: string) {
    const result = await CommentModel.delete(commentId, userId);
    if (result.count === 0) throw new Error('Comment not found or unauthorized');
    return result;
  },
};