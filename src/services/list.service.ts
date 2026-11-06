// backend/src/services/list.service.ts
import { ListModel } from '../models/list.model';
import { ProjectModel } from '../models/project.model';
import { WorkspaceModel } from '../models/workspace.model';

export const ListService = {
  listByProject(projectId: string, userId: string) {
    return ListModel.findAllByProject(projectId, userId);
  },

  getOne(id: string, userId: string) {
    return ListModel.findByIdAndMember(id, userId);
  },

  async create(projectId: string, userId: string, input: { name: string }) {
    if (!input.name?.trim()) throw new Error('List name is required');

    // 1. Verify the user has access to the project
    const project = await ProjectModel.findByIdAndMember(projectId, userId);
    if (!project) throw new Error('Project not found or unauthorized');

    // 2. Verify the user is an ADMIN in this workspace
    // (per your requirement: only admins can create lists)
    const isAdmin = await WorkspaceModel.isAdmin(project.workspaceId, userId);
    if (!isAdmin) throw new Error('Only workspace admins can create lists');

    return ListModel.create(projectId, { name: input.name.trim() });
  },

  async update(id: string, userId: string, input: { name?: string }) {
    // Optional: Add an Admin check here if only admins should rename lists
    const result = await ListModel.update(id, userId, input);
    if (result.count === 0) throw new Error('List not found or unauthorized');
    return ListModel.findByIdAndMember(id, userId);
  },

  async delete(id: string, userId: string) {
    // Optional: Add an Admin check here if only admins should delete lists
    const result = await ListModel.delete(id, userId);
    if (result.count === 0) throw new Error('List not found or unauthorized');
  },

  async reorder(listIds: string[], userId: string) {
    return ListModel.reorder(listIds, userId);
  },
};