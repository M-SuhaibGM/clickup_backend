"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAutomation = exports.createAutomation = exports.listAutomations = void 0;
const automation_service_1 = require("../services/automation.service");
const workspace_service_1 = require("../services/workspace.service");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.listAutomations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const ws = await workspace_service_1.WorkspaceService.getOne(workspaceId, req.user.id);
    const me = ws?.members.find(m => m.userId === req.user.id);
    if (me?.role !== 'ADMIN')
        return res.status(403).json({ error: 'Admin only' });
    const automations = await automation_service_1.AutomationService.list(workspaceId);
    res.json({ automations });
});
exports.createAutomation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const ws = await workspace_service_1.WorkspaceService.getOne(workspaceId, req.user.id);
    const me = ws?.members.find(m => m.userId === req.user.id);
    if (me?.role !== 'ADMIN')
        return res.status(403).json({ error: 'Admin only' });
    const { trigger, action, actionValue } = req.body;
    if (!trigger || !action)
        return res.status(400).json({ error: 'Trigger and action required' });
    const automation = await automation_service_1.AutomationService.create(workspaceId, { trigger, action, actionValue });
    res.status(201).json({ automation });
});
exports.deleteAutomation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const ws = await workspace_service_1.WorkspaceService.getOne(workspaceId, req.user.id);
    const me = ws?.members.find(m => m.userId === req.user.id);
    if (me?.role !== 'ADMIN')
        return res.status(403).json({ error: 'Admin only' });
    await automation_service_1.AutomationService.delete(req.params.id, workspaceId);
    res.json({ success: true });
});
