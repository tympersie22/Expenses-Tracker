import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a demo user
  const user = await prisma.user.create({
    data: {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
    },
  });

  // Create a demo account
  const account = await prisma.account.create({
    data: {
      id: '1',
      name: 'Main Account',
      type: 'checking',
      userId: user.id,
    },
  });

  // Create some demo expenses
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.expense.createMany({
    data: [
      {
        amount: 64.30,
        description: 'Grocery shopping',
        category: 'food',
        date: today,
        userId: user.id,
        accountId: account.id,
      },
      {
        amount: 72.50,
        description: 'Restaurant dinner',
        category: 'food',
        date: yesterday,
        userId: user.id,
        accountId: account.id,
      },
    ],
  });

  console.log('Database has been seeded. 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 