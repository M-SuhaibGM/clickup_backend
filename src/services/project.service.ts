// backend/src/services/project.service.ts
import { ProjectModel } from '../models/project.model';
import { WorkspaceModel } from '../models/workspace.model';

export const ProjectService = {
  list(workspaceId: string, userId: string) {
    return ProjectModel.findAllByWorkspace(workspaceId, userId);
  },

  getOne(id: string, userId: string) {
    return ProjectModel.findByIdAndMember(id, userId);
  },

  async create(workspaceId: string, userId: string, input: { name: string; description?: string; color?: string }) {
    if (!input.name?.trim()) throw new Error('Project name is required');

    // 🔒 Admin check: only admins can create projects
    const isAdmin = await WorkspaceModel.isAdmin(workspaceId, userId);
    if (!isAdmin) throw new Error('Only workspace admins can create projects');

    return ProjectModel.create(workspaceId, userId, {
      name: input.name.trim(),
      description: input.description?.trim(),
      color: input.color,
    });
  },

  async update(id: string, userId: string, input: { name?: string; description?: string; color?: string }) {
    const project = await ProjectModel.findByIdAndMember(id, userId);
    if (!project) throw new Error('Project not found or unauthorized');

    const isAdmin = await WorkspaceModel.isAdmin(project.workspaceId, userId);
    if (!isAdmin) throw new Error('Only admins can update projects');

    const result = await ProjectModel.update(id, userId, input);
    if (result.count === 0) throw new Error('Project not found or unauthorized');
    return ProjectModel.findByIdAndMember(id, userId);
  },

  async delete(id: string, userId: string) {
    const project = await ProjectModel.findByIdAndMember(id, userId);
    if (!project) throw new Error('Project not found or unauthorized');

    const isAdmin = await WorkspaceModel.isAdmin(project.workspaceId, userId);
    if (!isAdmin) throw new Error('Only admins can delete projects');

    const result = await ProjectModel.delete(id, userId);
    if (result.count === 0) throw new Error('Project not found or unauthorized');
  },
};