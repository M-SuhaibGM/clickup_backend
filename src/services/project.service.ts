// backend/src/services/project.service.ts
import { ProjectModel } from '../models/project.model';
import { WorkspaceModel } from '../models/workspace.model';
import { prisma } from '../models';

/** The space must exist AND belong to the same workspace as the project. */
async function assertSpaceInWorkspace(spaceId: string, workspaceId: string) {
  const space = await prisma.space.findFirst({ where: { id: spaceId, workspaceId }, select: { id: true } });
  if (!space) throw new Error('Space not found in this workspace');
}

export const ProjectService = {
  list(workspaceId: string, userId: string) {
    return ProjectModel.findAllByWorkspace(workspaceId, userId);
  },

  getOne(id: string, userId: string) {
    return ProjectModel.findByIdAndMember(id, userId);
  },

  async create(
    workspaceId: string,
    userId: string,
    input: { name: string; spaceId?: string; description?: string; color?: string }
  ) {
    if (!input.name?.trim()) throw new Error('Project name is required');
    if (!input.spaceId) throw new Error('A project must belong to a space');

    // 🔒 Admin check: only admins can create projects
    const isAdmin = await WorkspaceModel.isAdmin(workspaceId, userId);
    if (!isAdmin) throw new Error('Only workspace admins can create projects');

    await assertSpaceInWorkspace(input.spaceId, workspaceId);

    return ProjectModel.create(workspaceId, userId, input.spaceId, {
      name: input.name.trim(),
      description: input.description?.trim(),
      color: input.color,
    });
  },

  async update(
    id: string,
    userId: string,
    input: { name?: string; description?: string; color?: string; spaceId?: string }
  ) {
    const project = await ProjectModel.findByIdAndMember(id, userId);
    if (!project) throw new Error('Project not found or unauthorized');

    const isAdmin = await WorkspaceModel.isAdmin(project.workspaceId, userId);
    if (!isAdmin) throw new Error('Only admins can update projects');

    // Whitelist fields so nothing else (workspaceId, creatorId…) can be rewritten
    const data: { name?: string; description?: string; color?: string; spaceId?: string } = {};
    if (input.name !== undefined) {
      if (!input.name.trim()) throw new Error('Project name is required');
      data.name = input.name.trim();
    }
    if (input.description !== undefined) data.description = input.description.trim();
    if (input.color !== undefined) data.color = input.color;
    if (input.spaceId !== undefined && input.spaceId !== project.spaceId) {
      await assertSpaceInWorkspace(input.spaceId, project.workspaceId);
      data.spaceId = input.spaceId;
    }

    const result = await ProjectModel.update(id, userId, data);
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