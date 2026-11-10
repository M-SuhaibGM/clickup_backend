"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWorkspace = exports.updateWorkspace = exports.removeMember = exports.updateMember = exports.addMember = exports.createWorkspace = exports.getWorkspace = exports.listWorkspaces = void 0;
const workspace_service_1 = require("../services/workspace.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const models_1 = require("../models");
const activity_service_1 = require("../services/activity.service"); // ← Import
exports.listWorkspaces = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const workspaces = await workspace_service_1.WorkspaceService.list(req.user.id);
    res.json({ workspaces });
});
exports.getWorkspace = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const workspace = await workspace_service_1.WorkspaceService.getOne(req.params.id, req.user.id);
    if (!workspace)
        return res.status(404).json({ error: 'Workspace not found' });
    res.json({ workspace });
});
exports.createWorkspace = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const workspace = await workspace_service_1.WorkspaceService.create(req.user.id, req.body.name);
        res.status(201).json({ workspace });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.addMember = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email is required' });
        const workspaceId = req.params.id;
        const result = await workspace_service_1.WorkspaceService.addMemberByEmail(workspaceId, req.user.id, email);
        // ─── LOG ACTIVITY ───
        await activity_service_1.ActivityService.log({
            workspaceId,
            userId: req.user.id,
            action: 'added',
            entityType: 'member',
            entityName: result.user.name,
        });
        res.json(result);
    }
    catch (err) {
        const message = err.message;
        const status = message.includes('admin') ? 403 : 400;
        res.status(status).json({ error: message });
    }
});
exports.updateMember = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id: workspaceId, memberId } = req.params;
        const { role, jobTitle } = req.body;
        const senderId = req.user.id;
        const isAdmin = await workspace_service_1.WorkspaceService.getOne(workspaceId, senderId).then(w => w?.members.find(m => m.userId === senderId)?.role === 'ADMIN');
        if (!isAdmin)
            return res.status(403).json({ error: 'Only admins can edit members' });
        const updated = await models_1.prisma.workspaceMember.update({
            where: { id: memberId },
            data: {
                ...(role && { role }),
                ...(jobTitle !== undefined && { jobTitle })
            },
            include: { user: { select: { name: true } } },
        });
        // ─── LOG ACTIVITY ───
        await activity_service_1.ActivityService.log({
            workspaceId: workspaceId,
            userId: senderId,
            action: 'updated',
            entityType: 'member',
            entityName: updated.user.name,
            metadata: { changes: req.body },
        });
        res.json({ member: updated });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.removeMember = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id: workspaceId, memberId } = req.params;
        const senderId = req.user.id;
        const isAdmin = await workspace_service_1.WorkspaceService.getOne(workspaceId, senderId).then(w => w?.members.find(m => m.userId === senderId)?.role === 'ADMIN');
        if (!isAdmin)
            return res.status(403).json({ error: 'Only admins can remove members' });
        // Fetch the member first to get their name for the log
        const memberToRemove = await models_1.prisma.workspaceMember.findUnique({
            where: { id: memberId },
            include: { user: { select: { name: true } } },
        });
        await models_1.prisma.workspaceMember.delete({
            where: { id: memberId },
        });
        // ─── LOG ACTIVITY ───
        if (memberToRemove) {
            await activity_service_1.ActivityService.log({
                workspaceId: workspaceId,
                userId: senderId,
                action: 'removed',
                entityType: 'member',
                entityName: memberToRemove.user.name,
            });
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.updateWorkspace = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const senderId = req.user.id;
        if (!name?.trim())
            return res.status(400).json({ error: 'Workspace name is required' });
        const isAdmin = await workspace_service_1.WorkspaceService.getOne(id, senderId).then(w => w?.members.find(m => m.userId === senderId)?.role === 'ADMIN');
        if (!isAdmin)
            return res.status(403).json({ error: 'Only admins can update the workspace' });
        const updated = await models_1.prisma.workspace.update({
            where: { id: id },
            data: { name: name.trim() },
        });
        // ─── LOG ACTIVITY ───
        await activity_service_1.ActivityService.log({
            workspaceId: id,
            userId: senderId,
            action: 'renamed',
            entityType: 'workspace',
            entityName: name.trim(),
        });
        res.json({ workspace: updated });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.deleteWorkspace = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const senderId = req.user.id;
        const isAdmin = await workspace_service_1.WorkspaceService.getOne(id, senderId).then(w => w?.members.find(m => m.userId === senderId)?.role === 'ADMIN');
        if (!isAdmin)
            return res.status(403).json({ error: 'Only admins can delete the workspace' });
        // Note: We don't log "deleted workspace" because the activity table gets wiped 
        // with the workspace (cascade delete). You'd log this elsewhere if needed.
        await models_1.prisma.workspace.delete({ where: { id: id } });
        res.json({ success: true });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
