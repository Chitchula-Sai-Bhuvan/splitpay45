import 'dotenv/config';
import prisma from './config/mysql'; // Which is now SQLite via provider
import bcrypt from 'bcrypt';
import logger from './utils/logger';

const main = async () => {
    logger.info('🌱 Seeding database (SQLite)...');

    // 1. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const users = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    const createdUsers = [];

    for (const name of users) {
        const email = `${name.toLowerCase()}@example.com`;
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: { name, email, passwordHash }
        });
        createdUsers.push(user);
        logger.info(`User ${name} ready.`);
    }

    // 2. Create Sample Group
    const group = await prisma.group.create({
        data: {
            name: "Goa Trip",
            createdById: createdUsers[0].id,
            members: {
                create: createdUsers.slice(0, 3).map(u => ({ userId: u.id, role: 'MEMBER' })) // Alice, Bob, Charlie
            }
        }
    });
    logger.info(`Group 'Goa Trip' created.`);

    // 3. Create Sample Expenses (Alice pays for Bob & Charlie)
    // We can call created service functions if we import them, but direct DB is easier for seed
    // Let's create an expense where Alice pays 300 for Alice, Bob, Charlie (100 each)
    const payer = createdUsers[0]; // Alice
    const expense = await prisma.expense.create({
        data: {
            groupId: group.id,
            payerId: payer.id,
            amount: 300,
            description: "Lunch at Beach Shack",
            shares: {
                create: [
                    { userId: createdUsers[0].id, amount: 100 },
                    { userId: createdUsers[1].id, amount: 100 },
                    { userId: createdUsers[2].id, amount: 100 }
                ]
            }
        }
    });

    // Populate Ledger manually for this seed expense
    // Bob owes Alice 100
    await prisma.debtLedger.create({
        data: {
            groupId: group.id,
            expenseId: expense.id,
            payerId: createdUsers[1].id, // Bob
            payeeId: payer.id,            // Alice
            amount: 100
        }
    });
    // Charlie owes Alice 100
    await prisma.debtLedger.create({
        data: {
            groupId: group.id,
            expenseId: expense.id,
            payerId: createdUsers[2].id, // Charlie
            payeeId: payer.id,            // Alice
            amount: 100
        }
    });

    logger.info('✅ Seeding complete.');
};

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
