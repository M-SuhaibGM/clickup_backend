"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceActivities = void 0;
const activity_service_1 = require("../services/activity.service");
const workspace_service_1 = require("../services/workspace.service");
const asyncHandler_1 = require("../utils/asyncHandler");
exports.getWorkspaceActivities = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    // Verify user is an Admin in the workspace
    const workspace = await workspace_service_1.WorkspaceService.getOne(workspaceId, userId);
    if (!workspace)
        return res.status(404).json({ error: 'Workspace not found' });
    const me = workspace.members.find(m => m.userId === userId);
    if (me?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only admins can view activity history' });
    }
    const activities = await activity_service_1.ActivityService.list(workspaceId);
    res.json({ activities });
});
