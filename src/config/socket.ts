import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { TokenService } from '../services/token.service';
import { WorkspaceModel } from '../models/workspace.model';
import { ProjectModel } from '../models/project.model';
import { env } from './env';

let io: SocketServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    },
  });

  // Middleware to authenticate the socket connection using the JWT
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const payload = TokenService.verifyAccessToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`🔌 User connected to Socket.io: ${userId}`);

    // ─── PROJECT ROOMS ───
    socket.on('join:project', async (projectId: string) => {
      try {
        // Check if user has access to this project (authorization check)
        const project = await ProjectModel.findByIdAndMember(projectId, userId);
        if (!project) {
          socket.emit('error', { message: 'Unauthorized: No access to this project' });
          return;
        }

        socket.join(`project:${projectId}`);
      } catch (error) {
        console.error('Error joining project room:', error);
        socket.emit('error', { message: 'Failed to join project room' });
      }
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // ─── WORKSPACE ROOMS (For history/activity) ───
    socket.on('join:workspace', async (workspaceId: string) => {
      try {
        // Check if user is a member of this workspace
        const workspace = await WorkspaceModel.findByIdAndMember(workspaceId, userId);
        if (!workspace) {
          socket.emit('error', { message: 'Unauthorized: No access to this workspace' });
          return;
        }

        socket.join(`workspace:${workspaceId}`);
      } catch (error) {
        console.error('Error joining workspace room:', error);
        socket.emit('error', { message: 'Failed to join workspace room' });
      }
    });

    socket.on('leave:workspace', (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${userId}`);
    });
  });

  return io;
};

// Helper function to emit events from anywhere in the app
export const getIO = (): SocketServer => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};