"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceService = void 0;
// backend/src/services/workspace.service.ts
const workspace_model_1 = require("../models/workspace.model");
const email_service_1 = require("./email.service");
const models_1 = require("../models");
exports.WorkspaceService = {
    list(userId) {
        return workspace_model_1.WorkspaceModel.findAllByUser(userId);
    },
    getOne(id, userId) {
        return workspace_model_1.WorkspaceModel.findByIdAndMember(id, userId);
    },
    async create(userId, name) {
        if (!name?.trim())
            throw new Error('Workspace name is required');
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
        return workspace_model_1.WorkspaceModel.create(userId, { name: name.trim(), slug });
    },
    async addMemberByEmail(workspaceId, senderId, email) {
        // 1. Verify the sender is an Admin
        const isAdmin = await workspace_model_1.WorkspaceModel.isAdmin(workspaceId, senderId);
        if (!isAdmin)
            throw new Error('Only workspace admins can add members');
        // 2. Check if the user exists in the database
        const userToAdd = await workspace_model_1.WorkspaceModel.findUserByEmail(email);
        if (!userToAdd) {
            throw new Error('No user found with this email. They must sign up first.');
        }
        // 3. Check if they are already in the workspace
        const existingMember = await models_1.prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: { workspaceId, userId: userToAdd.id },
            },
        });
        if (existingMember) {
            throw new Error('This user is already a member of this workspace.');
        }
        // 4. Add them to the workspace
        await workspace_model_1.WorkspaceModel.addMember(workspaceId, userToAdd.id);
        // 5. Send notification email
        const workspace = await workspace_model_1.WorkspaceModel.findByIdAndMember(workspaceId, senderId);
        const sender = await models_1.prisma.user.findUnique({ where: { id: senderId } });
        if (workspace && sender) {
            // Fire and forget (don't await so the API stays fast)
            email_service_1.EmailService.sendAddedToWorkspaceEmail(userToAdd.email, userToAdd.name, workspace.name, sender.name);
        }
        return { success: true, user: { name: userToAdd.name, email: userToAdd.email } };
    },
};
