"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
// backend/src/models/comment.model.ts
const index_1 = require("./index");
exports.CommentModel = {
    create(taskId, userId, text) {
        return index_1.prisma.comment.create({
            data: { taskId, userId, text },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
            },
        });
    },
    update(id, userId, text) {
        return index_1.prisma.comment.updateMany({
            where: { id, userId }, // Only update if the user owns it
            data: { text },
        });
    },
    delete(id, userId) {
        return index_1.prisma.comment.deleteMany({
            where: { id, userId },
        });
    },
};
