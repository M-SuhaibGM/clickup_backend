"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListModel = void 0;
// backend/src/models/list.model.ts
const index_1 = require("./index");
exports.ListModel = {
    findAllByProject(projectId, userId) {
        return index_1.prisma.list.findMany({
            where: {
                projectId,
                // Ensure the user is a member of the workspace that owns this project
                project: { workspace: { members: { some: { userId } } } }
            },
            orderBy: { order: 'asc' },
            include: { _count: { select: { tasks: true } } },
        });
    },
    findByIdAndMember(id, userId) {
        return index_1.prisma.list.findFirst({
            where: {
                id,
                project: { workspace: { members: { some: { userId } } } }
            },
            include: {
                project: { select: { id: true, name: true, color: true } },
                tasks: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        assignee: { select: { id: true, name: true, avatar: true } },
                    },
                },
            },
        });
    },
    create(projectId, data) {
        return index_1.prisma.list.create({
            data: {
                name: data.name,
                projectId,
            },
            include: { _count: { select: { tasks: true } } },
        });
    },
    update(id, userId, data) {
        return index_1.prisma.list.updateMany({
            where: {
                id,
                project: { workspace: { members: { some: { userId } } } }
            },
            data,
        });
    },
    delete(id, userId) {
        return index_1.prisma.list.deleteMany({
            where: {
                id,
                project: { workspace: { members: { some: { userId } } } }
            },
        });
    },
    async reorder(listIds, userId) {
        const updates = listIds.map((id, index) => index_1.prisma.list.updateMany({
            where: {
                id,
                project: { workspace: { members: { some: { userId } } } }
            },
            data: { order: index },
        }));
        return index_1.prisma.$transaction(updates);
    },
};
