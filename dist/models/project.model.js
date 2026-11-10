"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModel = void 0;
// backend/src/models/project.model.ts
const index_1 = require("./index");
exports.ProjectModel = {
    // Find all projects in a workspace, ensuring the user is a member
    findAllByWorkspace(workspaceId, userId) {
        return index_1.prisma.project.findMany({
            where: {
                workspaceId,
                workspace: { members: { some: { userId } } }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { lists: true }
                }
            },
        });
    },
    // Find a single project, ensuring the user is a member
    findByIdAndMember(id, userId) {
        return index_1.prisma.project.findFirst({
            where: {
                id,
                workspace: { members: { some: { userId } } }
            },
            include: {
                lists: { orderBy: { order: 'asc' } }, // Assuming lists have an order field now
            },
        });
    },
    // Create a project (workspaceId and creatorId are required)
    create(workspaceId, creatorId, data) {
        return index_1.prisma.project.create({
            data: {
                ...data,
                workspaceId,
                creatorId
            },
        });
    },
    // Update a project, ensuring the user is a member
    update(id, userId, data) {
        return index_1.prisma.project.updateMany({
            where: {
                id,
                workspace: { members: { some: { userId } } }
            },
            data,
        });
    },
    // Delete a project, ensuring the user is a member
    delete(id, userId) {
        return index_1.prisma.project.deleteMany({
            where: {
                id,
                workspace: { members: { some: { userId } } }
            },
        });
    },
};
