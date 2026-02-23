import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create or update a demo user matching the current schema.
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {
      firstName: 'Demo',
      lastName: 'User',
      password: 'demo-password-change-me',
    },
    create: {
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      password: 'demo-password-change-me',
    },
  });

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'mono',
        providerAccountId: 'demo-account-1',
      },
    },
    update: {
      type: 'depository',
      userId: user.id,
    },
    create: {
      type: 'depository',
      provider: 'mono',
      providerAccountId: 'demo-account-1',
      userId: user.id,
    },
  });

  console.log('Database has been seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
