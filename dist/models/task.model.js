"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskModel = void 0;
// backend/src/models/task.model.ts
const index_1 = require("./index");
exports.TaskModel = {
    findAllByList(listId, userId) {
        return index_1.prisma.task.findMany({
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
    findByIdAndMember(id, userId) {
        return index_1.prisma.task.findFirst({
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
    create(listId, data) {
        return index_1.prisma.task.create({
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
    update(id, userId, data) {
        return index_1.prisma.task.updateMany({
            where: {
                id,
                list: { project: { workspace: { members: { some: { userId } } } } }
            },
            data,
        });
    },
    delete(id, userId) {
        return index_1.prisma.task.deleteMany({
            where: {
                id,
                list: { project: { workspace: { members: { some: { userId } } } } }
            },
        });
    },
    findAllAssignedToUser(workspaceId, userId) {
        return index_1.prisma.task.findMany({
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
    async reorder(taskIds, userId) {
        const updates = taskIds.map((id, index) => index_1.prisma.task.updateMany({
            where: {
                id,
                list: { project: { workspace: { members: { some: { userId } } } } }
            },
            data: { order: index },
        }));
        return index_1.prisma.$transaction(updates);
    },
};
