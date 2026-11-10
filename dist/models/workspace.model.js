"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceModel = void 0;
// backend/src/models/workspace.model.ts
const index_1 = require("./index");
exports.WorkspaceModel = {
    // backend/src/models/workspace.model.ts
    create(userId, data) {
        return index_1.prisma.workspace.create({
            data: {
                ...data,
                owner: { connect: { id: userId } }, // required by the schema
                members: {
                    create: { userId, role: 'ADMIN' }, // creator is also an admin member
                },
            },
        });
    },
    findAllByUser(userId) {
        return index_1.prisma.workspace.findMany({
            where: { members: { some: { userId } } },
            include: { _count: { select: { members: true, projects: true } } },
        });
    },
    findByIdAndMember(id, userId) {
        return index_1.prisma.workspace.findFirst({
            where: { id, members: { some: { userId } } },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, avatar: true } }
                    }
                },
            },
        });
    },
    async isAdmin(workspaceId, userId) {
        const member = await index_1.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
        });
        return member?.role === 'ADMIN';
    },
    // ─── NEW: Find a user by email to add them directly ───
    findUserByEmail(email) {
        return index_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
    },
    // ─── NEW: Directly add a member to the workspace ───
    addMember(workspaceId, userId) {
        return index_1.prisma.workspaceMember.create({
            data: {
                workspaceId,
                userId,
                role: 'MEMBER',
            },
        });
    },
};
