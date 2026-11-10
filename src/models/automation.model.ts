import { prisma } from './index';

export const AutomationModel = {
  findByTrigger(workspaceId: string, trigger: string) {
    return prisma.automation.findMany({
      where: { workspaceId, trigger, isActive: true },
    });
  },

  findAll(workspaceId: string) {
    return prisma.automation.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
  },

  create(data: { workspaceId: string; trigger: string; action: string; actionValue?: string }) {
    return prisma.automation.create({ data });
  },

  delete(id: string, workspaceId: string) {
    return prisma.automation.deleteMany({ where: { id, workspaceId } });
  },
};