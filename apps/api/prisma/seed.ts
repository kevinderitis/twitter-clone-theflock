import { prisma } from '../src/lib/prisma.js';
import { hashPassword } from '../src/modules/auth/auth.security.js';
import { buildSeedPlan } from './seed.data.js';

async function main() {
  process.env.JWT_SECRET ??= 'seed-jwt-secret';
  process.env.JWT_EXPIRES_IN ??= '1h';

  const passwordHash = await hashPassword('Password123!');
  const plan = buildSeedPlan(passwordHash);

  await prisma.$transaction(async (tx) => {
    await tx.like.deleteMany();
    await tx.follow.deleteMany();
    await tx.tweet.deleteMany();
    await tx.user.deleteMany();

    await tx.user.createMany({
      data: plan.users,
    });

    await tx.tweet.createMany({
      data: plan.tweets,
    });

    await tx.follow.createMany({
      data: plan.follows,
    });

    await tx.like.createMany({
      data: plan.likes,
    });
  });

  console.log(
    `Seeded ${plan.users.length} users, ${plan.tweets.length} tweets, ${plan.follows.length} follows, and ${plan.likes.length} likes.`,
  );
  console.log('Demo credentials:');
  console.log('- demo@example.com / Password123!');
  console.log('- kevin@example.com / Password123!');
}

main()
  .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
