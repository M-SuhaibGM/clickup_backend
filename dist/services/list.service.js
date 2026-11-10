"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListService = void 0;
// backend/src/services/list.service.ts
const list_model_1 = require("../models/list.model");
const project_model_1 = require("../models/project.model");
const workspace_model_1 = require("../models/workspace.model");
exports.ListService = {
    listByProject(projectId, userId) {
        return list_model_1.ListModel.findAllByProject(projectId, userId);
    },
    getOne(id, userId) {
        return list_model_1.ListModel.findByIdAndMember(id, userId);
    },
    async create(projectId, userId, input) {
        if (!input.name?.trim())
            throw new Error('List name is required');
        // 1. Verify the user has access to the project
        const project = await project_model_1.ProjectModel.findByIdAndMember(projectId, userId);
        if (!project)
            throw new Error('Project not found or unauthorized');
        // 2. Verify the user is an ADMIN in this workspace
        // (per your requirement: only admins can create lists)
        const isAdmin = await workspace_model_1.WorkspaceModel.isAdmin(project.workspaceId, userId);
        if (!isAdmin)
            throw new Error('Only workspace admins can create lists');
        return list_model_1.ListModel.create(projectId, { name: input.name.trim() });
    },
    async update(id, userId, input) {
        // Optional: Add an Admin check here if only admins should rename lists
        const result = await list_model_1.ListModel.update(id, userId, input);
        if (result.count === 0)
            throw new Error('List not found or unauthorized');
        return list_model_1.ListModel.findByIdAndMember(id, userId);
    },
    async delete(id, userId) {
        // Optional: Add an Admin check here if only admins should delete lists
        const result = await list_model_1.ListModel.delete(id, userId);
        if (result.count === 0)
            throw new Error('List not found or unauthorized');
    },
    async reorder(listIds, userId) {
        return list_model_1.ListModel.reorder(listIds, userId);
    },
};
