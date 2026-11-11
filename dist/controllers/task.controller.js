"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingTaskCount = exports.listMyTasks = exports.reorderTasks = exports.getTask = exports.listTasks = exports.deleteTask = exports.updateTask = exports.createTask = void 0;
const task_service_1 = require("../services/task.service");
const asyncHandler_1 = require("../utils/asyncHandler");
const socket_1 = require("../config/socket");
const email_service_1 = require("../services/email.service");
const models_1 = require("../models");
const task_model_1 = require("../models/task.model");
const activity_service_1 = require("../services/activity.service"); // ← Import
exports.createTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const task = await task_service_1.TaskService.create(req.params.listId, req.user.id, req.body);
        const io = (0, socket_1.getIO)();
        io.to(`project:${task.list.project.id}`).emit('task:created', task);
        // ─── LOG ACTIVITY ───
        await activity_service_1.ActivityService.log({
            workspaceId: task.list.project.workspaceId,
            userId: req.user.id,
            action: 'created',
            entityType: 'task',
            entityName: task.title,
        });
        res.status(201).json({ task });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.updateTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const existingTask = await task_model_1.TaskModel.findByIdAndMember(req.params.id, req.user.id);
        if (!existingTask)
            return res.status(404).json({ error: 'Task not found' });
        const previousAssigneeId = existingTask.assigneeId;
        const task = await task_service_1.TaskService.update(req.params.id, req.user.id, req.body);
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
        const io = (0, socket_1.getIO)();
        io.to(`project:${task.list.project.id}`).emit('task:updated', task);
        // ─── LOG ACTIVITY ───
        await activity_service_1.ActivityService.log({
            workspaceId: task.list.project.workspaceId,
            userId: req.user.id,
            action: 'updated',
            entityType: 'task',
            entityName: task.title,
        });
        const newAssigneeId = task.assigneeId;
        const assigneeChanged = newAssigneeId && newAssigneeId !== previousAssigneeId;
        if (assigneeChanged && task.assignee?.email) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const taskUrl = `${frontendUrl}/tasks/${task.id}`;
            email_service_1.EmailService.sendTaskAssignedEmail(task.assignee.email, task.assignee.name, task.title, taskUrl, task.list.project.name || 'Workspace');
        }
        res.json({ task });
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
});
exports.deleteTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const task = await task_service_1.TaskService.getOne(req.params.id, req.user.id);
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
        await task_service_1.TaskService.delete(req.params.id, req.user.id);
        const io = (0, socket_1.getIO)();
        io.to(`project:${task.list.project.id}`).emit('task:deleted', {
            id: task.id,
            listId: task.listId
        });
        // ─── LOG ACTIVITY ───
        await activity_service_1.ActivityService.log({
            workspaceId: task.list.project.workspaceId,
            userId: req.user.id,
            action: 'deleted',
            entityType: 'task',
            entityName: task.title,
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
});
exports.listTasks = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const tasks = await task_service_1.TaskService.listByList(req.params.listId, req.user.id);
    res.json({ tasks });
});
exports.getTask = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const task = await task_service_1.TaskService.getOne(req.params.id, req.user.id);
    if (!task)
        return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
});
exports.reorderTasks = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds)) {
        return res.status(400).json({ error: 'taskIds must be an array' });
    }
    await task_service_1.TaskService.reorder(taskIds, req.user.id);
    res.json({ success: true });
});
exports.listMyTasks = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { workspaceId } = req.params;
    const tasks = await task_service_1.TaskService.listAssignedToUser(workspaceId, req.user.id);
    res.json({ tasks });
});
exports.getPendingTaskCount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { workspaceId } = req.params;
    const userId = req.user.id;
    const count = await models_1.prisma.task.count({
        where: {
            assigneeId: userId,
            status: { not: 'DONE' },
            parentId: null,
            list: { project: { workspaceId: workspaceId } },
        },
    });
    res.json({ count });
});
