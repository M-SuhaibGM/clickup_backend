"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderLists = exports.deleteList = exports.updateList = exports.createList = exports.getList = exports.listByProject = void 0;
const list_service_1 = require("../services/list.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const activity_service_1 = require("../services/activity.service"); // ← Import
const models_1 = require("../models"); // ← Import prisma
exports.listByProject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const lists = await list_service_1.ListService.listByProject(req.params.projectId, req.user.id);
    res.json({ lists });
});
exports.getList = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const list = await list_service_1.ListService.getOne(req.params.id, req.user.id);
    if (!list)
        return res.status(404).json({ error: 'List not found' });
    res.json({ list });
});
exports.createList = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const list = await list_service_1.ListService.create(req.params.projectId, req.user.id, req.body);
        // ─── LOG ACTIVITY ───
        const project = await models_1.prisma.project.findUnique({
            where: { id: req.params.projectId },
            select: { workspaceId: true }
        });
        if (project) {
            await activity_service_1.ActivityService.log({
                workspaceId: project.workspaceId,
                userId: req.user.id,
                action: 'created',
                entityType: 'list',
                entityName: list.name,
            });
        }
        res.status(201).json({ list });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.updateList = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const list = await list_service_1.ListService.update(req.params.id, req.user.id, req.body);
        // ─── LOG ACTIVITY ───
        const dbList = await models_1.prisma.list.findUnique({
            where: { id: req.params.id },
            include: { project: { select: { workspaceId: true } } }
        });
        if (dbList) {
            await activity_service_1.ActivityService.log({
                workspaceId: dbList.project.workspaceId,
                userId: req.user.id,
                action: 'updated',
                entityType: 'list',
                entityName: dbList.name,
            });
        }
        res.json({ list });
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
});
exports.deleteList = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Fetch list first to get its name and workspace ID for the log
        const dbList = await models_1.prisma.list.findUnique({
            where: { id: req.params.id },
            include: { project: { select: { workspaceId: true } } }
        });
        await list_service_1.ListService.delete(req.params.id, req.user.id);
        // ─── LOG ACTIVITY ───
        if (dbList) {
            await activity_service_1.ActivityService.log({
                workspaceId: dbList.project.workspaceId,
                userId: req.user.id,
                action: 'deleted',
                entityType: 'list',
                entityName: dbList.name,
            });
        }
        res.json({ success: true });
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
});
exports.reorderLists = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { listIds } = req.body;
    if (!Array.isArray(listIds))
        return res.status(400).json({ error: 'listIds must be an array' });
    await list_service_1.ListService.reorder(listIds, req.user.id);
    res.json({ success: true });
});
