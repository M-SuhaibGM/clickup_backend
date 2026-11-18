// backend/src/services/team.service.ts
import { TeamModel } from '../models/team.model';
import { WorkspaceModel } from '../models/workspace.model';
import { prisma } from '../models';

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const MAX_NAME = 50;
const MAX_DESCRIPTION = 2000;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const ICON_KEY = /^[a-z0-9-]{1,40}$/;

type TeamInput = { name?: string; color?: string; icon?: string | null; description?: string | null };

function cleanOptional(input: TeamInput) {
  const out: { color?: string; icon?: string | null; description?: string | null } = {};
  if (input.color !== undefined) {
    if (!HEX_COLOR.test(input.color)) throw httpError('Color must be a hex value like #6366f1', 400);
    out.color = input.color;
  }
  if (input.icon !== undefined) {
    if (input.icon !== null && !ICON_KEY.test(input.icon)) throw httpError('Invalid icon', 400);
    out.icon = input.icon;
  }
  if (input.description !== undefined) {
    const d = input.description === null ? '' : String(input.description).trim();
    if (d.length > MAX_DESCRIPTION) throw httpError(`Description is too long (max ${MAX_DESCRIPTION})`, 400);
    out.description = d || null;
  }
  return out;
}

function cleanName(raw: unknown) {
  const name = typeof raw === 'string' ? raw.trim() : '';
  if (!name) throw httpError('Team name is required', 400);
  if (name.length > MAX_NAME) throw httpError(`Team name is too long (max ${MAX_NAME})`, 400);
  return name;
}

async function requireTeamAdmin(id: string, userId: string, verb: string) {
  const team = await TeamModel.findByIdAndMember(id, userId);
  if (!team) throw httpError('Team not found or unauthorized', 404);
  if (!(await WorkspaceModel.isAdmin(team.workspaceId, userId))) {
    throw httpError(`Only workspace admins can ${verb} teams`, 403);
  }
  return team;
}

export const TeamService = {
  async list(workspaceId: string, userId: string) {
    const ws = await WorkspaceModel.findByIdAndMember(workspaceId, userId);
    if (!ws) throw httpError('Workspace not found or unauthorized', 403);
    return TeamModel.findAllByWorkspace(workspaceId, userId);
  },

  async create(workspaceId: string, userId: string, input: TeamInput) {
    const name = cleanName(input.name);
    const optional = cleanOptional(input);
    if (!(await WorkspaceModel.isAdmin(workspaceId, userId))) {
      throw httpError('Only workspace admins can create teams', 403);
    }
    return TeamModel.create(workspaceId, userId, { name, ...optional });
  },

  async update(id: string, userId: string, input: TeamInput) {
    await requireTeamAdmin(id, userId, 'edit');
    const data: TeamInput = cleanOptional(input);
    if (input.name !== undefined) data.name = cleanName(input.name);
    await TeamModel.update(id, userId, data);
    return TeamModel.findByIdAndMember(id, userId);
  },

  async delete(id: string, userId: string) {
    const team = await requireTeamAdmin(id, userId, 'delete');
    await TeamModel.delete(id, userId);
    return team;
  },

  async addMember(id: string, userId: string, memberUserId: unknown) {
    const team = await requireTeamAdmin(id, userId, 'manage');
    if (typeof memberUserId !== 'string' || !memberUserId) throw httpError('userId is required', 400);
    const inWorkspace = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: team.workspaceId, userId: memberUserId } },
    });
    if (!inWorkspace) throw httpError('That person is not in this workspace', 400);
    await TeamModel.addMember(id, memberUserId);
    return TeamModel.findByIdAndMember(id, userId);
  },

  async removeMember(id: string, userId: string, memberUserId: string) {
    await requireTeamAdmin(id, userId, 'manage');
    await TeamModel.removeMember(id, memberUserId);
    return TeamModel.findByIdAndMember(id, userId);
  },
};
