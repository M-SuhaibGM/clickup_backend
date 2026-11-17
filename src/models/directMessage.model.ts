// backend/src/models/directMessage.model.ts
import { prisma } from './index';

const userSelect = { id: true, name: true, avatar: true };

export const DirectMessageModel = {
  create(workspaceId: string, senderId: string, receiverId: string, text: string) {
    return prisma.directMessage.create({
      data: { workspaceId, senderId, receiverId, text },
      include: { sender: { select: userSelect } },
    });
  },

  /** Conversation between two users, newest page first (returned oldest → newest). */
  async conversation(workspaceId: string, a: string, b: string, before?: Date, take = 50) {
    const rows = await prisma.directMessage.findMany({
      where: {
        workspaceId,
        OR: [
          { senderId: a, receiverId: b },
          { senderId: b, receiverId: a },
        ],
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: { sender: { select: userSelect } },
    });
    return rows.reverse();
  },

  /** Unread message counts for `userId`, grouped by sender. */
  unreadBySender(workspaceId: string, userId: string) {
    return prisma.directMessage.groupBy({
      by: ['senderId'],
      where: { workspaceId, receiverId: userId, readAt: null },
      _count: { _all: true },
    });
  },

  /** Latest message (either direction) per conversation partner, for sidebar sorting. */
  async lastActivity(workspaceId: string, userId: string) {
    const rows = await prisma.directMessage.findMany({
      where: { workspaceId, OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      select: { senderId: true, receiverId: true, createdAt: true },
      take: 500,
    });
    const last: Record<string, Date> = {};
    for (const r of rows) {
      const other = r.senderId === userId ? r.receiverId : r.senderId;
      if (!last[other]) last[other] = r.createdAt;
    }
    return last;
  },

  markRead(workspaceId: string, receiverId: string, senderId: string) {
    return prisma.directMessage.updateMany({
      where: { workspaceId, receiverId, senderId, readAt: null },
      data: { readAt: new Date() },
    });
  },
};
