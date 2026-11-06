// backend/src/models/project.model.ts
import { prisma } from './index';

export const ProjectModel = {
  // Find all projects in a workspace, ensuring the user is a member
  findAllByWorkspace(workspaceId: string, userId: string) {
    return prisma.project.findMany({
      where: { 
        workspaceId,
        workspace: { members: { some: { userId } } } 
      },
      orderBy: { createdAt: 'desc' },
      include: { 
        _count: { 
          select: { lists: true } 
        } 
      },
    });
  },

  // Find a single project, ensuring the user is a member
  findByIdAndMember(id: string, userId: string) {
    return prisma.project.findFirst({
      where: { 
        id, 
        workspace: { members: { some: { userId } } } 
      },
      include: {
        lists: { orderBy: { order: 'asc' } }, // Assuming lists have an order field now
      },
    });
  },

  // Create a project (workspaceId and creatorId are required)
  create(workspaceId: string, creatorId: string, data: { name: string; description?: string; color?: string }) {
    return prisma.project.create({
      data: { 
        ...data, 
        workspaceId,
        creatorId
      },
    });
  },

  // Update a project, ensuring the user is a member
  update(id: string, userId: string, data: { name?: string; description?: string; color?: string }) {
    return prisma.project.updateMany({
      where: { 
        id, 
        workspace: { members: { some: { userId } } } 
      },
      data,
    });
  },

  // Delete a project, ensuring the user is a member
  delete(id: string, userId: string) {
    return prisma.project.deleteMany({
      where: { 
        id, 
        workspace: { members: { some: { userId } } } 
      },
    });
  },
};