// One-off, idempotent migration for data created before Spaces/Channels existed:
//   1. every workspace gets a "Team Space" if it has none
//   2. every project without a space is moved into its workspace's first space
//   3. every project without a channel gets one, named after the project
// Safe to run repeatedly.  Usage: npm run backfill:spaces
import { prisma } from '../src/models';

async function main() {
  const workspaces = await prisma.workspace.findMany({ select: { id: true, name: true } });
  let spacesCreated = 0;
  let projectsMoved = 0;
  let channelsCreated = 0;

  for (const ws of workspaces) {
    let space = await prisma.space.findFirst({
      where: { workspaceId: ws.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    if (!space) {
      space = await prisma.space.create({ data: { workspaceId: ws.id, name: 'Team Space', order: 0 } });
      spacesCreated++;
    }
    const moved = await prisma.project.updateMany({
      where: { workspaceId: ws.id, spaceId: null },
      data: { spaceId: space.id },
    });
    projectsMoved += moved.count;
  }

  const withoutChannel = await prisma.project.findMany({
    where: { channel: null },
    select: { id: true, name: true },
  });
  for (const p of withoutChannel) {
    await prisma.channel.create({ data: { projectId: p.id, name: p.name } });
    channelsCreated++;
  }

  console.log(
    `Done. spaces created: ${spacesCreated}, projects assigned to a space: ${projectsMoved}, channels created: ${channelsCreated}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
