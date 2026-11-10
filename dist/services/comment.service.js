"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
// backend/src/services/comment.service.ts
const comment_model_1 = require("../models/comment.model");
const task_model_1 = require("../models/task.model");
exports.CommentService = {
    async create(taskId, userId, text) {
        if (!text.trim())
            throw new Error('Comment cannot be empty');
        // FIXED: Using findByIdAndMember to check workspace access
        const task = await task_model_1.TaskModel.findByIdAndMember(taskId, userId);
        if (!task)
            throw new Error('Task not found or unauthorized');
        return comment_model_1.CommentModel.create(taskId, userId, text.trim());
    },
    async update(commentId, userId, text) {
        if (!text.trim())
            throw new Error('Comment cannot be empty');
        const result = await comment_model_1.CommentModel.update(commentId, userId, text.trim());
        if (result.count === 0)
            throw new Error('Comment not found or unauthorized');
        return result;
    },
    async delete(commentId, userId) {
        const result = await comment_model_1.CommentModel.delete(commentId, userId);
        if (result.count === 0)
            throw new Error('Comment not found or unauthorized');
        return result;
    },
};
