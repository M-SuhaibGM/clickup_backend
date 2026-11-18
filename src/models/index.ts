import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;

// Neon connects over a WebSocket. After the compute has been idle (or on the
// very first connection) that handshake can fail once — Node surfaces it as a
// bare `ErrorEvent`, not an Error — and succeeds on the next attempt.
const adapter = new PrismaNeon({
  connectionString,
  connectionTimeoutMillis: 15_000, // allow time for a suspended compute to wake up
  idleTimeoutMillis: 30_000, // drop idle sockets before the server/pooler kills them
});

const baseClient = new PrismaClient({ adapter });

// Prisma codes for "can't reach / lost the database" and pool timeouts.
const TRANSIENT_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

export function isTransientDbError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; type?: string; message?: string; constructor?: { name?: string } };
  if (e.constructor?.name === 'ErrorEvent' || e.type === 'error') return true; // WebSocket handshake failure
  if (e.code && TRANSIENT_CODES.has(e.code)) return true;
  return /ECONNRESET|ECONNREFUSED|ETIMEDOUT|Connection terminated|connection (?:timeout|closed)|WebSocket/i.test(e.message ?? '');
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Human-readable text for any thrown value (ErrorEvent has no `.message` on some runtimes). */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  const e = err as { message?: string; error?: { message?: string }; type?: string } | null;
  return e?.message ?? e?.error?.message ?? (e?.type ? `${e.type} event` : String(err));
}

// Only idempotent reads are retried — re-running them can never duplicate data.
const READ_OPERATIONS = new Set([
  'findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow',
  'findMany', 'count', 'aggregate', 'groupBy',
]);
const RETRY_DELAYS_MS = [300, 900];

export const prisma = baseClient.$extends({
  query: {
    async $allOperations({ operation, args, query }) {
      if (!READ_OPERATIONS.has(operation)) return query(args);
      for (let attempt = 0; ; attempt++) {
        try {
          return await query(args);
        } catch (err) {
          if (attempt >= RETRY_DELAYS_MS.length || !isTransientDbError(err)) throw err;
          await sleep(RETRY_DELAYS_MS[attempt]);
        }
      }
    },
  },
});

/** Opens the first connection up front so the first real request isn't the one that pays for it. */
export async function warmDatabase(): Promise<void> {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      if (attempt === 4) {
        console.warn('⚠️  Database warm-up failed:', describeError(err));
        return;
      }
      await sleep(500 * attempt);
    }
  }
}
