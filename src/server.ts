import http from 'http'; // ← Import
import app from './app';
import { env } from './config/env';
import { prisma } from './models';
import { initSocket } from './config/socket'; // ← Import

const server = http.createServer(app); // ← Change app.listen to http.createServer
initSocket(server); // ← Initialize Socket.io

server.listen(env.port, () => {
  console.log(`\n🚀 Server running on http://localhost:${env.port}`);
  console.log(`🌐 Environment: ${env.nodeEnv}`);
  console.log(`🔌 WebSocket ready`);
  console.log(`-----------------------------------------\n`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    console.log('🔌 Database disconnected.');
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));