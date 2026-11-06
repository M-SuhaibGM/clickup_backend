// backend/src/services/workspace.service.ts
import { WorkspaceModel } from '../models/workspace.model';
import { EmailService } from './email.service';
import { prisma } from '../models';

export const WorkspaceService = {
  list(userId: string) {
    return WorkspaceModel.findAllByUser(userId);
  },

  getOne(id: string, userId: string) {
    return WorkspaceModel.findByIdAndMember(id, userId);
  },

  async create(userId: string, name: string) {
    if (!name?.trim()) throw new Error('Workspace name is required');
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    return WorkspaceModel.create(userId, { name: name.trim(), slug });
  },

  async addMemberByEmail(workspaceId: string, senderId: string, email: string) {
    // 1. Verify the sender is an Admin
    const isAdmin = await WorkspaceModel.isAdmin(workspaceId, senderId);
    if (!isAdmin) throw new Error('Only workspace admins can add members');

    // 2. Check if the user exists in the database
    const userToAdd = await WorkspaceModel.findUserByEmail(email);
    if (!userToAdd) {
      throw new Error('No user found with this email. They must sign up first.');
    }

    // 3. Check if they are already in the workspace
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: userToAdd.id },
      },
    });
    if (existingMember) {
      throw new Error('This user is already a member of this workspace.');
    }

    // 4. Add them to the workspace
    await WorkspaceModel.addMember(workspaceId, userToAdd.id);

    // 5. Send notification email
    const workspace = await WorkspaceModel.findByIdAndMember(workspaceId, senderId);
    const sender = await prisma.user.findUnique({ where: { id: senderId } });

    if (workspace && sender) {
      // Fire and forget (don't await so the API stays fast)
      EmailService.sendAddedToWorkspaceEmail(
        userToAdd.email,
        userToAdd.name,
        workspace.name,
        sender.name
      );
    }

    return { success: true, user: { name: userToAdd.name, email: userToAdd.email } };
  },
};