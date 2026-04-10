import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.vote.deleteMany();
  await prisma.post.deleteMany();

  await prisma.post.createMany({
    data: [
      {
        title: 'Rust should be the default for new CLIs',
        description:
          'Memory safety, great tooling with cargo, and fast binaries. Convince me otherwise.',
        votes: 42,
      },
      {
        title: 'Tailwind is just inline styles wearing a hat',
        description:
          'Hot take: utility-first CSS is great, but we should talk about its tradeoffs honestly.',
        votes: 17,
      },
      {
        title: 'Your monorepo does not need Nx',
        description:
          'npm workspaces + a handful of scripts will take most teams surprisingly far.',
        votes: 28,
      },
      {
        title: 'SQLite in production is underrated',
        description:
          'Litestream, WAL mode, and a single file. For many apps it is the right call.',
        votes: 55,
      },
      {
        title: 'Flutter for internal tools is a cheat code',
        description:
          'One codebase, pixel-perfect UI on every platform. Perfect for ops dashboards.',
        votes: 9,
      },
    ],
  });

  const count = await prisma.post.count();
  console.log(`Seeded ${count} posts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
