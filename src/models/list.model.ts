// backend/src/models/list.model.ts
import { prisma } from './index';

export const ListModel = {
  findAllByProject(projectId: string, userId: string) {
    return prisma.list.findMany({
      where: { 
        projectId,
        // Ensure the user is a member of the workspace that owns this project
        project: { workspace: { members: { some: { userId } } } }
      },
      orderBy: { order: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });
  },

  findByIdAndMember(id: string, userId: string) {
    return prisma.list.findFirst({
      where: { 
        id, 
        project: { workspace: { members: { some: { userId } } } } 
      },
      include: {
        project: { select: { id: true, name: true, color: true, workspaceId: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
  },

  create(projectId: string, data: { name: string }) {
    return prisma.list.create({
      data: {
        name: data.name,
        projectId,
      },
      include: { _count: { select: { tasks: true } } },
    });
  },

  update(id: string, userId: string, data: { name?: string }) {
    return prisma.list.updateMany({
      where: { 
        id, 
        project: { workspace: { members: { some: { userId } } } } 
      },
      data,
    });
  },

  delete(id: string, userId: string) {
    return prisma.list.deleteMany({
      where: { 
        id, 
        project: { workspace: { members: { some: { userId } } } } 
      },
    });
  },

  async reorder(listIds: string[], userId: string) {
    const updates = listIds.map((id, index) =>
      prisma.list.updateMany({
        where: { 
          id, 
          project: { workspace: { members: { some: { userId } } } } 
        },
        data: { order: index },
      })
    );
    return prisma.$transaction(updates);
  },
};