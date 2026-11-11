"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const token_service_1 = require("../services/token.service");
const workspace_model_1 = require("../models/workspace.model");
const project_model_1 = require("../models/project.model");
const env_1 = require("./env");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: env_1.env.frontendUrl,
            credentials: true,
        },
    });
    // Middleware to authenticate the socket connection using the JWT
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token)
                return next(new Error('Authentication error'));
            const payload = token_service_1.TokenService.verifyAccessToken(token);
            socket.data.userId = payload.userId;
            next();
        }
        catch (err) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        console.log(`🔌 User connected to Socket.io: ${userId}`);
        // ─── PROJECT ROOMS ───
        socket.on('join:project', async (projectId) => {
            try {
                // Check if user has access to this project (authorization check)
                const project = await project_model_1.ProjectModel.findByIdAndMember(projectId, userId);
                if (!project) {
                    socket.emit('error', { message: 'Unauthorized: No access to this project' });
                    return;
                }
                socket.join(`project:${projectId}`);
            }
            catch (error) {
                console.error('Error joining project room:', error);
                socket.emit('error', { message: 'Failed to join project room' });
            }
        });
        socket.on('leave:project', (projectId) => {
            socket.leave(`project:${projectId}`);
        });
        // ─── WORKSPACE ROOMS (For history/activity) ───
        socket.on('join:workspace', async (workspaceId) => {
            try {
                // Check if user is a member of this workspace
                const workspace = await workspace_model_1.WorkspaceModel.findByIdAndMember(workspaceId, userId);
                if (!workspace) {
                    socket.emit('error', { message: 'Unauthorized: No access to this workspace' });
                    return;
                }
                socket.join(`workspace:${workspaceId}`);
            }
            catch (error) {
                console.error('Error joining workspace room:', error);
                socket.emit('error', { message: 'Failed to join workspace room' });
            }
        });
        socket.on('leave:workspace', (workspaceId) => {
            socket.leave(`workspace:${workspaceId}`);
        });
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${userId}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
// Helper function to emit events from anywhere in the app
const getIO = () => {
    if (!io)
        throw new Error('Socket.io not initialized!');
    return io;
};
exports.getIO = getIO;
