// backend/src/services/space.service.ts
import { SpaceModel } from '../models/space.model';
import { WorkspaceModel } from '../models/workspace.model';

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

const MAX_NAME = 50;
const MAX_DESCRIPTION = 500;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const ICON_KEY = /^[a-z0-9-]{1,40}$/;

type SpaceInput = { name?: string; color?: string; icon?: string | null; description?: string | null };

/** Validates the optional fields; returns only the ones that were supplied. */
function cleanOptional(input: SpaceInput) {
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
  if (!name) throw httpError('Space name is required', 400);
  if (name.length > MAX_NAME) throw httpError(`Space name is too long (max ${MAX_NAME})`, 400);
  return name;
}

export const SpaceService = {
  async list(workspaceId: string, userId: string) {
    const ws = await WorkspaceModel.findByIdAndMember(workspaceId, userId);
    if (!ws) throw httpError('Workspace not found or unauthorized', 403);
    return SpaceModel.findAllByWorkspace(workspaceId, userId);
  },

  async create(workspaceId: string, userId: string, input: SpaceInput) {
    const name = cleanName(input.name);
    const optional = cleanOptional(input);
    if (!(await WorkspaceModel.isAdmin(workspaceId, userId))) {
      throw httpError('Only workspace admins can create spaces', 403);
    }
    return SpaceModel.create(workspaceId, { name, ...optional });
  },

  async update(id: string, userId: string, input: SpaceInput) {
    const space = await SpaceModel.findByIdAndMember(id, userId);
    if (!space) throw httpError('Space not found or unauthorized', 404);
    if (!(await WorkspaceModel.isAdmin(space.workspaceId, userId))) {
      throw httpError('Only workspace admins can edit spaces', 403);
    }
    const data: { name?: string; color?: string; icon?: string | null; description?: string | null } = cleanOptional(input);
    if (input.name !== undefined) data.name = cleanName(input.name);
    await SpaceModel.update(id, userId, data);
    return SpaceModel.findByIdAndMember(id, userId);
  },

  /** Deletes the space AND everything in it (projects, channels, lists, tasks). */
  async delete(id: string, userId: string) {
    const space = await SpaceModel.findByIdAndMember(id, userId);
    if (!space) throw httpError('Space not found or unauthorized', 404);
    if (!(await WorkspaceModel.isAdmin(space.workspaceId, userId))) {
      throw httpError('Only workspace admins can delete spaces', 403);
    }
    await SpaceModel.delete(id, userId);
    return space;
  },
};
