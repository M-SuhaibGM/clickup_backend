// backend/src/models/team.model.ts
import { prisma } from './index';

const memberOf = (userId: string) => ({ workspace: { members: { some: { userId } } } });

const include = {
  members: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } }, orderBy: { createdAt: 'asc' as const } },
};

export const TeamModel = {
  findAllByWorkspace(workspaceId: string, userId: string) {
    return prisma.team.findMany({
      where: { workspaceId, ...memberOf(userId) },
      orderBy: { createdAt: 'asc' },
      include,
    });
  },

  findByIdAndMember(id: string, userId: string) {
    return prisma.team.findFirst({ where: { id, ...memberOf(userId) }, include });
  },

  create(
    workspaceId: string,
    creatorId: string,
    data: { name: string; color?: string; icon?: string | null; description?: string | null }
  ) {
    return prisma.team.create({
      // The creator is the team's first member
      data: { ...data, workspaceId, members: { create: { userId: creatorId } } },
      include,
    });
  },

  update(id: string, userId: string, data: { name?: string; color?: string; icon?: string | null; description?: string | null }) {
    return prisma.team.updateMany({ where: { id, ...memberOf(userId) }, data });
  },

  delete(id: string, userId: string) {
    return prisma.team.deleteMany({ where: { id, ...memberOf(userId) } });
  },

  addMember(teamId: string, userId: string) {
    return prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  },

  removeMember(teamId: string, userId: string) {
    return prisma.teamMember.deleteMany({ where: { teamId, userId } });
  },
};
