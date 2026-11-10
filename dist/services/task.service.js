"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
// backend/src/services/task.service.ts
const task_model_1 = require("../models/task.model");
const list_model_1 = require("../models/list.model");
const automation_service_1 = require("./automation.service"); // ← Import
const models_1 = require("../models"); // ← Import to fetch workspaceId
const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
exports.TaskService = {
    listByList(listId, userId) {
        return task_model_1.TaskModel.findAllByList(listId, userId);
    },
    getOne(id, userId) {
        return task_model_1.TaskModel.findByIdAndMember(id, userId);
    },
    async create(listId, userId, input) {
        if (!input.title?.trim())
            throw new Error('Task title is required');
        const list = await list_model_1.ListModel.findByIdAndMember(listId, userId);
        if (!list)
            throw new Error('List not found or unauthorized');
        const data = {
            title: input.title.trim(),
            description: input.description?.trim(),
        };
        if (input.status) {
            if (!VALID_STATUSES.includes(input.status))
                throw new Error('Invalid status');
            data.status = input.status;
        }
        if (input.priority) {
            if (!VALID_PRIORITIES.includes(input.priority))
                throw new Error('Invalid priority');
            data.priority = input.priority;
        }
        if (input.dueDate)
            data.dueDate = new Date(input.dueDate);
        if (input.assigneeId)
            data.assigneeId = input.assigneeId;
        if (input.parentId)
            data.parentId = input.parentId;
        const task = await task_model_1.TaskModel.create(listId, data);
        // ─── RUN AUTOMATIONS ───
        // Get the workspaceId for this task's list
        const project = await models_1.prisma.project.findUnique({
            where: { id: list.projectId },
            select: { workspaceId: true },
        });
        if (project) {
            await automation_service_1.AutomationService.runTriggers(project.workspaceId, 'TASK_CREATED', task);
        }
        return task;
    },
    async update(id, userId, input) {
        const data = {};
        if (input.title !== undefined) {
            if (!input.title.trim())
                throw new Error('Title cannot be empty');
            data.title = input.title.trim();
        }
        if (input.description !== undefined)
            data.description = input.description?.trim() ?? null;
        if (input.status !== undefined) {
            if (!VALID_STATUSES.includes(input.status))
                throw new Error('Invalid status');
            data.status = input.status;
        }
        if (input.priority !== undefined) {
            if (!VALID_PRIORITIES.includes(input.priority))
                throw new Error('Invalid priority');
            data.priority = input.priority;
        }
        if (input.dueDate !== undefined) {
            data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
        }
        if (input.assigneeId !== undefined)
            data.assigneeId = input.assigneeId || null;
        if (input.attachments !== undefined)
            data.attachments = input.attachments;
        const result = await task_model_1.TaskModel.update(id, userId, data);
        if (result.count === 0)
            throw new Error('Task not found or unauthorized');
        const updatedTask = await task_model_1.TaskModel.findByIdAndMember(id, userId);
        // ─── RUN AUTOMATIONS ───
        if (updatedTask) {
            // Get workspaceId
            const project = await models_1.prisma.project.findUnique({
                where: { id: updatedTask.list.projectId },
                select: { workspaceId: true },
            });
            if (project) {
                // Trigger: task status changed to DONE
                if (input.status === 'DONE') {
                    await automation_service_1.AutomationService.runTriggers(project.workspaceId, 'STATUS_DONE', updatedTask);
                }
                // Trigger: task priority changed to URGENT
                if (input.priority === 'URGENT') {
                    await automation_service_1.AutomationService.runTriggers(project.workspaceId, 'PRIORITY_URGENT', updatedTask);
                }
            }
        }
        return updatedTask;
    },
    async delete(id, userId) {
        const task = await task_model_1.TaskModel.findByIdAndMember(id, userId);
        if (!task)
            throw new Error('Task not found or unauthorized');
        const result = await task_model_1.TaskModel.delete(id, userId);
        if (result.count === 0)
            throw new Error('Task not found or unauthorized');
        return task;
    },
    listAssignedToUser(workspaceId, userId) {
        return task_model_1.TaskModel.findAllAssignedToUser(workspaceId, userId);
    },
    async reorder(taskIds, userId) {
        return task_model_1.TaskModel.reorder(taskIds, userId);
    },
};
