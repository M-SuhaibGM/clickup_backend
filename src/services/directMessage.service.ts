// backend/src/services/directMessage.service.ts
import { DirectMessageModel } from '../models/directMessage.model';
import { WorkspaceModel } from '../models/workspace.model';
import { getIO } from '../config/socket';

const MAX_LENGTH = 4000;

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

/** Both users must belong to the workspace. */
async function assertBothMembers(workspaceId: string, userId: string, otherId: string) {
  const workspace = await WorkspaceModel.findByIdAndMember(workspaceId, userId);
  if (!workspace) throw httpError('Workspace not found or unauthorized', 403);
  if (!workspace.members.some((m) => m.userId === otherId)) {
    throw httpError('That user is not in this workspace', 404);
  }
}

export const DirectMessageService = {
  async send(workspaceId: string, senderId: string, receiverId: string, rawText: string) {
    const text = (rawText ?? '').trim();
    if (!text) throw httpError('Message cannot be empty', 400);
    if (text.length > MAX_LENGTH) throw httpError(`Message is too long (max ${MAX_LENGTH})`, 400);
    await assertBothMembers(workspaceId, senderId, receiverId);

    const message = await DirectMessageModel.create(workspaceId, senderId, receiverId, text);

    // Real-time: deliver to every open tab of both participants
    const io = getIO();
    io.to(`user:${receiverId}`).emit('dm:new', message);
    if (senderId !== receiverId) io.to(`user:${senderId}`).emit('dm:new', message);

    return message;
  },

  async history(workspaceId: string, userId: string, otherId: string, before?: string) {
    await assertBothMembers(workspaceId, userId, otherId);
    const beforeDate = before ? new Date(before) : undefined;
    if (beforeDate && isNaN(beforeDate.getTime())) throw httpError('Invalid "before" date', 400);
    return DirectMessageModel.conversation(workspaceId, userId, otherId, beforeDate);
  },

  async summary(workspaceId: string, userId: string) {
    const workspace = await WorkspaceModel.findByIdAndMember(workspaceId, userId);
    if (!workspace) throw httpError('Workspace not found or unauthorized', 403);

    const [unread, last] = await Promise.all([
      DirectMessageModel.unreadBySender(workspaceId, userId),
      DirectMessageModel.lastActivity(workspaceId, userId),
    ]);
    return {
      unread: Object.fromEntries(unread.map((u) => [u.senderId, u._count._all])),
      lastMessageAt: Object.fromEntries(Object.entries(last).map(([k, v]) => [k, v.toISOString()])),
    };
  },

  async markRead(workspaceId: string, userId: string, otherId: string) {
    await assertBothMembers(workspaceId, userId, otherId);
    const result = await DirectMessageModel.markRead(workspaceId, userId, otherId);
    if (result.count > 0) {
      // Let the sender's other tabs / the sender know their messages were read
      getIO().to(`user:${otherId}`).emit('dm:read', { workspaceId, byUserId: userId });
    }
    return result.count;
  },
};
