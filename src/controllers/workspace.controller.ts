// backend/src/controllers/workspace.controller.ts
import { Request, Response } from 'express';
import { WorkspaceService } from '../services/workspace.service';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../models';
import { ActivityService } from '../services/activity.service'; // ← Import

export const listWorkspaces = asyncHandler(async (req: Request, res: Response) => {
  const rows = await WorkspaceService.list(req.user!.id);
  res.json({
    workspaces: rows.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      ownerId: w.ownerId,
      _count: w._count,
      role: w.members[0]?.role ?? 'MEMBER',
    })),
  });
});
export const getWorkspace = asyncHandler(async (req: Request, res: Response) => {
  const workspace = await WorkspaceService.getOne(req.params.id as string, req.user!.id);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  res.json({ workspace });
});

export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
  try {
    const workspace = await WorkspaceService.create(req.user!.id, req.body.name);
    res.status(201).json({ workspace });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const workspaceId = req.params.id as string;

    const result = await WorkspaceService.addMemberByEmail(
      workspaceId,
      req.user!.id,
      email
    );

    // ─── LOG ACTIVITY ───
    await ActivityService.log({
      workspaceId,
      userId: req.user!.id,
      action: 'added',
      entityType: 'member',
      entityName: result.user.name,
    });

    res.json(result);
  } catch (err) {
    const message = (err as Error).message;
    const status = message.includes('admin') ? 403 : 400;
    res.status(status).json({ error: message });
  }
});

export const updateMember = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id: workspaceId, memberId } = req.params;
    const { role, jobTitle } = req.body;
    const senderId = req.user!.id;

    const isAdmin = await WorkspaceService.getOne(workspaceId as string, senderId).then(w =>
      w?.members.find(m => m.userId === senderId)?.role === 'ADMIN'
    );
    if (!isAdmin) return res.status(403).json({ error: 'Only admins can edit members' });

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId as string, workspaceId: workspaceId as string },
      data: {
        ...(role && { role }),
        ...(jobTitle !== undefined && { jobTitle })
      },
      include: { user: { select: { name: true } } },
    });

    // ─── LOG ACTIVITY ───
    await ActivityService.log({
      workspaceId: workspaceId as string,
      userId: senderId,
      action: 'updated',
      entityType: 'member',
      entityName: updated.user.name,
      metadata: { changes: req.body },
    });

    res.json({ member: updated });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id: workspaceId, memberId } = req.params;
    const senderId = req.user!.id;

    const isAdmin = await WorkspaceService.getOne(workspaceId as string, senderId).then(w =>
      w?.members.find(m => m.userId === senderId)?.role === 'ADMIN'
    );
    if (!isAdmin) return res.status(403).json({ error: 'Only admins can remove members' });

    // Fetch the member first to get their name for the log
    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id: memberId as string },
      include: { user: { select: { name: true } } },
    });

    await prisma.workspaceMember.delete({
      where: { id: memberId as string, workspaceId: workspaceId as string },
    });

    // ─── LOG ACTIVITY ───
    if (memberToRemove) {
      await ActivityService.log({
        workspaceId: workspaceId as string,
        userId: senderId,
        action: 'removed',
        entityType: 'member',
        entityName: memberToRemove.user.name,
      });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const updateWorkspace = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const senderId = req.user!.id;

    if (!name?.trim()) return res.status(400).json({ error: 'Workspace name is required' });

    const isAdmin = await WorkspaceService.getOne(id as string, senderId).then(w =>
      w?.members.find(m => m.userId === senderId)?.role === 'ADMIN'
    );
    if (!isAdmin) return res.status(403).json({ error: 'Only admins can update the workspace' });

    const updated = await prisma.workspace.update({
      where: { id: id as string },
      data: { name: name.trim() },
    });

    // ─── LOG ACTIVITY ───
    await ActivityService.log({
      workspaceId: id as string,
      userId: senderId,
      action: 'renamed',
      entityType: 'workspace',
      entityName: name.trim(),
    });

    res.json({ workspace: updated });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export const deleteWorkspace = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const senderId = req.user!.id;

    const isAdmin = await WorkspaceService.getOne(id as string, senderId).then(w =>
      w?.members.find(m => m.userId === senderId)?.role === 'ADMIN'
    );
    if (!isAdmin) return res.status(403).json({ error: 'Only admins can delete the workspace' });

    // Note: We don't log "deleted workspace" because the activity table gets wiped 
    // with the workspace (cascade delete). You'd log this elsewhere if needed.
    await prisma.workspace.delete({ where: { id: id as string } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export async function listMembers(req: Request, res: Response) {
  const { id: workspaceId } = req.params;
  const userId = req.user!.id;

  // Optional: ensure requester is a member
  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspaceId as string, userId } },
  });
  if (!requester) return res.status(403).json({ message: 'Not a member' });

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspaceId as string },
    include: { user: true },
  });

  return res.json(members);
}

