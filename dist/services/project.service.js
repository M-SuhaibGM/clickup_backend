"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
// backend/src/services/project.service.ts
const project_model_1 = require("../models/project.model");
const workspace_model_1 = require("../models/workspace.model");
exports.ProjectService = {
    list(workspaceId, userId) {
        return project_model_1.ProjectModel.findAllByWorkspace(workspaceId, userId);
    },
    getOne(id, userId) {
        return project_model_1.ProjectModel.findByIdAndMember(id, userId);
    },
    async create(workspaceId, userId, input) {
        if (!input.name?.trim())
            throw new Error('Project name is required');
        // 🔒 Admin check: only admins can create projects
        const isAdmin = await workspace_model_1.WorkspaceModel.isAdmin(workspaceId, userId);
        if (!isAdmin)
            throw new Error('Only workspace admins can create projects');
        return project_model_1.ProjectModel.create(workspaceId, userId, {
            name: input.name.trim(),
            description: input.description?.trim(),
            color: input.color,
        });
    },
    async update(id, userId, input) {
        const project = await project_model_1.ProjectModel.findByIdAndMember(id, userId);
        if (!project)
            throw new Error('Project not found or unauthorized');
        const isAdmin = await workspace_model_1.WorkspaceModel.isAdmin(project.workspaceId, userId);
        if (!isAdmin)
            throw new Error('Only admins can update projects');
        const result = await project_model_1.ProjectModel.update(id, userId, input);
        if (result.count === 0)
            throw new Error('Project not found or unauthorized');
        return project_model_1.ProjectModel.findByIdAndMember(id, userId);
    },
    async delete(id, userId) {
        const project = await project_model_1.ProjectModel.findByIdAndMember(id, userId);
        if (!project)
            throw new Error('Project not found or unauthorized');
        const isAdmin = await workspace_model_1.WorkspaceModel.isAdmin(project.workspaceId, userId);
        if (!isAdmin)
            throw new Error('Only admins can delete projects');
        const result = await project_model_1.ProjectModel.delete(id, userId);
        if (result.count === 0)
            throw new Error('Project not found or unauthorized');
    },
};
