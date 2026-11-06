import { prisma } from './index';

export const ActivityModel = {
  create(data: {
    workspaceId: string;
    userId: string;
    action: string;
    entityType: string;
    entityName: string;
    metadata?: any;
  }) {
    return prisma.activity.create({
      data,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  },

  findAllByWorkspace(workspaceId: string) {
    return prisma.activity.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Cap at 100 for performance
    });
  },
};