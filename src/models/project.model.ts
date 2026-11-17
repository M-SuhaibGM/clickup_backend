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
        },
        channel: { select: { id: true, name: true } },
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
        space: { select: { id: true, name: true, color: true, icon: true } },
        channel: { select: { id: true, name: true } },
      },
    });
  },

  // Create a project inside a space. Its single channel is created in the same
  // write and takes the project's name.
  create(
    workspaceId: string,
    creatorId: string,
    spaceId: string,
    data: { name: string; description?: string; color?: string }
  ) {
    return prisma.project.create({
      data: {
        ...data,
        workspaceId,
        spaceId,
        creatorId,
        channel: { create: { name: data.name } },
      },
      include: {
        _count: { select: { lists: true } },
        channel: { select: { id: true, name: true } },
      },
    });
  },

  // Update a project, ensuring the user is a member. The channel name is kept
  // identical to the project name in the same transaction.
  async update(
    id: string,
    userId: string,
    data: { name?: string; description?: string; color?: string; spaceId?: string }
  ) {
    const [result] = await prisma.$transaction([
      prisma.project.updateMany({
        where: { id, workspace: { members: { some: { userId } } } },
        data,
      }),
      ...(data.name
        ? [prisma.channel.updateMany({ where: { projectId: id }, data: { name: data.name } })]
        : []),
    ]);
    return result;
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