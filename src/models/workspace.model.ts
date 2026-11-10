// backend/src/models/workspace.model.ts
import { prisma } from './index';

export const WorkspaceModel = {
  // backend/src/models/workspace.model.ts
  create(userId: string, data: { name: string; slug: string }) {
    return prisma.workspace.create({
      data: {
        ...data,
        owner: { connect: { id: userId } },          // required by the schema
        members: {
          create: { userId, role: 'ADMIN' },         // creator is also an admin member
        },
      },
    });
  },

  findAllByUser(userId: string) {
  return prisma.workspace.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { members: true, projects: true } },
      // Only the caller's own membership — just need the role
      members: {
        where: { userId },
        select: { role: true },
      },
    },
  });
},

  findByIdAndMember(id: string, userId: string) {
        // console.log('[findByIdAndMember] args =', { id, userId });

    return prisma.workspace.findFirst({
      where: { id, members: { some: { userId } } },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } }
          }
        },
      },
    });
  },

  async isAdmin(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    return member?.role === 'ADMIN';
  },

  // ─── NEW: Find a user by email to add them directly ───
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  },

  // ─── NEW: Directly add a member to the workspace ───
  addMember(workspaceId: string, userId: string) {
    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role: 'MEMBER',
      },
    });
  },

}
