// backend/src/services/comment.service.ts
import { CommentModel } from '../models/comment.model';
import { TaskModel } from '../models/task.model';

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

  async delete(commentId: string, userId: string) {
    const result = await CommentModel.delete(commentId, userId);
    if (result.count === 0) throw new Error('Comment not found or unauthorized');
    return result;
  },
};