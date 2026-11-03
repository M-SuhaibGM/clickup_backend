// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // This is the key part: the datasource for the CLI
  datasource: {
    url: env("DATABASE_URL"),
  },
});