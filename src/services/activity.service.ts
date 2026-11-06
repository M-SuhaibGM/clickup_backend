// backend/src/services/activity.service.ts
import { ActivityModel } from '../models/activity.model';
import { getIO } from '../config/socket';

export const ActivityService = {
  async log(data: {
    workspaceId: string;
    userId: string;
    action: string;
    entityType: string;
    entityName: string;
    metadata?: any;
  }) {
    const activity = await ActivityModel.create(data);
    const io = getIO();
    io.to(`workspace:${data.workspaceId}`).emit('activity:logged', activity);
    return activity;
  },

  list(workspaceId: string) {
    return ActivityModel.findAllByWorkspace(workspaceId);
  },
};