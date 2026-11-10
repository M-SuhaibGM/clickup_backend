"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
// backend/src/services/activity.service.ts
const activity_model_1 = require("../models/activity.model");
const socket_1 = require("../config/socket");
exports.ActivityService = {
    async log(data) {
        const activity = await activity_model_1.ActivityModel.create(data);
        const io = (0, socket_1.getIO)();
        io.to(`workspace:${data.workspaceId}`).emit('activity:logged', activity);
        return activity;
    },
    list(workspaceId) {
        return activity_model_1.ActivityModel.findAllByWorkspace(workspaceId);
    },
};
