import app from './app';
import { env } from './config/env';
import { prisma } from './models/db';

const server = app.listen(env.port, () => {
  console.log(`🚀 Server running on http://localhost:${env.port}`);
  console.log(`🌐 Environment: ${env.nodeEnv}`);
  console.log(`🔗 Google OAuth callback: ${env.googleCallbackUrl}`);
});

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));