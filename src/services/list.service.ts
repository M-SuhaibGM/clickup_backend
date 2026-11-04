// backend/src/services/list.service.ts
import { ListModel } from '../models/list.model';
import { ProjectModel } from '../models/project.model';

export const ListService = {
  listByProject(projectId: string, ownerId: string) {
    return ListModel.findAllByProject(projectId, ownerId);
  },

  getOne(id: string, ownerId: string) {
    return ListModel.findByIdAndOwner(id, ownerId);
  },

  async create(projectId: string, ownerId: string, input: { name: string }) {
    if (!input.name?.trim()) throw new Error('List name is required');

    // Ownership check: is the project ours?
    const project = await ProjectModel.findByIdAndOwner(projectId, ownerId);
    if (!project) throw new Error('Project not found or not owned by you');

    return ListModel.create(projectId, ownerId, { name: input.name.trim() });
  },

  async update(id: string, ownerId: string, input: { name?: string }) {
    const result = await ListModel.update(id, ownerId, input);
    if (result.count === 0) throw new Error('List not found or not owned by you');
    return ListModel.findByIdAndOwner(id, ownerId);
  },

  async delete(id: string, ownerId: string) {
    const result = await ListModel.delete(id, ownerId);
    if (result.count === 0) throw new Error('List not found or not owned by you');
  },
  async reorder(listIds: string[], ownerId: string) {
    return ListModel.reorder(listIds, ownerId);
  },
};