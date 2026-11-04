// backend/src/services/project.service.ts
import { ProjectModel } from '../models/project.model';

export const ProjectService = {
  list(ownerId: string) {
    return ProjectModel.findAllByOwner(ownerId);
  },

  getOne(id: string, ownerId: string) {
    return ProjectModel.findByIdAndOwner(id, ownerId);
  },

  create(ownerId: string, input: { name: string; description?: string; color?: string }) {
    if (!input.name?.trim()) throw new Error('Project name is required');
    return ProjectModel.create(ownerId, {
      name: input.name.trim(),
      description: input.description?.trim(),
      color: input.color,
    });
  },

  async update(id: string, ownerId: string, input: { name?: string; description?: string; color?: string }) {
    const result = await ProjectModel.update(id, ownerId, input);
    if (result.count === 0) throw new Error('Project not found or not owned by you');
    return ProjectModel.findByIdAndOwner(id, ownerId);
  },

  async delete(id: string, ownerId: string) {
    const result = await ProjectModel.delete(id, ownerId);
    if (result.count === 0) throw new Error('Project not found or not owned by you');
  },
};