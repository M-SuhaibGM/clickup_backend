"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http")); // ← Import
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const models_1 = require("./models");
const socket_1 = require("./config/socket"); // ← Import
const server = http_1.default.createServer(app_1.default); // ← Change app.listen to http.createServer
(0, socket_1.initSocket)(server); // ← Initialize Socket.io
server.listen(env_1.env.port, () => {
    console.log(`\n🚀 Server running on http://localhost:${env_1.env.port}`);
    console.log(`🌐 Environment: ${env_1.env.nodeEnv}`);
    console.log(`🔌 WebSocket ready`);
    console.log(`-----------------------------------------\n`);
});
// Graceful shutdown
async function shutdown(signal) {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
        console.log('🔌 Database disconnected.');
        await models_1.prisma.$disconnect();
        process.exit(0);
    });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
