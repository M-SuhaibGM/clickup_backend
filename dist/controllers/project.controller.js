"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = exports.listProjects = void 0;
const project_service_1 = require("../services/project.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const activity_service_1 = require("../services/activity.service"); // ← Import
exports.listProjects = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const projects = await project_service_1.ProjectService.list(workspaceId, req.user.id);
    res.json({ projects });
});
exports.getProject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const project = await project_service_1.ProjectService.getOne(projectId, req.user.id);
    if (!project)
        return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
});
exports.createProject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;
        const project = await project_service_1.ProjectService.create(workspaceId, req.user.id, req.body);
        // ─── LOG ACTIVITY ───
        await activity_service_1.ActivityService.log({
            workspaceId,
            userId: req.user.id,
            action: 'created',
            entityType: 'project',
            entityName: project.name,
        });
        res.status(201).json({ project });
    }
    catch (err) {
        const message = err.message;
        const status = message.includes('admin') ? 403 : 400;
        res.status(status).json({ error: message });
    }
});
exports.updateProject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const project = await project_service_1.ProjectService.update(projectId, req.user.id, req.body);
        // ─── LOG ACTIVITY ───
        if (project) {
            // We need workspaceId — ProjectService.getOne returns the full project with workspaceId
            const workspaceId = project.workspaceId;
            await activity_service_1.ActivityService.log({
                workspaceId,
                userId: req.user.id,
                action: 'updated',
                entityType: 'project',
                entityName: project.name,
            });
        }
        res.json({ project });
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
});
exports.deleteProject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        // Fetch first to get name + workspaceId for the log
        const project = await project_service_1.ProjectService.getOne(projectId, req.user.id);
        await project_service_1.ProjectService.delete(projectId, req.user.id);
        // ─── LOG ACTIVITY ───
        if (project) {
            const workspaceId = project.workspaceId;
            await activity_service_1.ActivityService.log({
                workspaceId,
                userId: req.user.id,
                action: 'deleted',
                entityType: 'project',
                entityName: project.name,
            });
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
});
