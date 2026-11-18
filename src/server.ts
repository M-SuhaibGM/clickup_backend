import http from 'http'; // ← Import
import app from './app';
import { env } from './config/env';
import { prisma, warmDatabase } from './models';
import { initSocket } from './config/socket'; // ← Import

const server = http.createServer(app); // ← Change app.listen to http.createServer
const io = initSocket(server); // ← Initialize Socket.io

server.listen(env.port, () => {
  console.log(`\n🚀 Server running on http://localhost:${env.port}`);
  console.log(`🌐 Environment: ${env.nodeEnv}`);
  console.log(`🔌 WebSocket ready`);
  console.log(`-----------------------------------------\n`);
  void warmDatabase(); // don't block startup; just take the cold-connection hit now
});

// Graceful shutdown
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

  // Open websockets / keep-alive sockets would otherwise keep server.close()
  // waiting forever, so force-exit if draining takes too long.
  const force = setTimeout(() => {
    console.error('Shutdown timed out — forcing exit.');
    process.exit(1);
  }, 10_000);
  force.unref();

  io.close(); // disconnects socket clients and closes the HTTP server
  server.closeIdleConnections();
  server.close(async () => {
    await prisma.$disconnect();
    console.log('🔌 Database disconnected.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));