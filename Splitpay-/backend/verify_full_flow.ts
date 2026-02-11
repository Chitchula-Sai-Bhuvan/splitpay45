
import 'dotenv/config';
import { registerUser } from './src/services/userService';
import { createGroup, addMember } from './src/services/groupService';
import { createExpense } from './src/services/expenseService';
import { getSuggestedSettlementsSQL } from './src/services/settlementService';
import prisma from './src/config/mysql';

const runVerification = async () => {
    console.log("=== Starting End-to-End Verification ===");

    try {
        // 1. Create Users (calls sp_create_user)
        const timestamp = Date.now();
        const email1 = `test.user1.${timestamp}@example.com`;
        const email2 = `test.user2.${timestamp}@example.com`;

        console.log(`\n1. Registering Users...`);
        const user1 = await registerUser(email1, 'Test User 1', 'password');
        const user2 = await registerUser(email2, 'Test User 2', 'password');
        console.log(`   User 1 Created: ID ${user1.id}`);
        console.log(`   User 2 Created: ID ${user2.id}`);

        // 2. Create Group (calls sp_create_group)
        console.log(`\n2. Creating Group...`);
        const group = await createGroup(`Test Group ${timestamp}`, user1.id);
        console.log(`   Group Created: ID ${group.id}, Name: ${group.name}`);

        // 3. Add Member (calls sp_add_group_member)
        console.log(`\n3. Adding Member...`);
        await addMember(group.id, email2);
        console.log(`   User 2 added to group.`);

        // 4. Add Expense (calls sp_add_expense)
        console.log(`\n4. Adding Expense...`);
        // User 1 pays 100, split 50/50
        const amount = 100.00;
        const shares = [
            { userId: user1.id, amount: 50.00 },
            { userId: user2.id, amount: 50.00 }
        ];

        const expense = await createExpense(group.id, user1.id, 'Dinner Verify', amount, shares);
        console.log(`   Expense Created: ID ${expense.id}`);

        // 5. Verify Ledger/Settlement (calls sp_generate_settlement_plan)
        console.log(`\n5. Checking Settlement Plan (SQL)...`);
        const plan = await getSuggestedSettlementsSQL(group.id);
        console.log(`   Settlement Plan:`, plan);

        console.log("\n=== Verification SUCCESS ===");

    } catch (error) {
        console.error("\n=== Verification FAILED ===");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
};

runVerification();
