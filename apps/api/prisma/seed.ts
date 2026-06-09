import { prisma } from '../src/lib/prisma.js';

async function main() {
  console.log(
    'Seed infrastructure is ready. No records have been inserted yet.',
  );
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
