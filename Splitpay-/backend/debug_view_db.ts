import prisma from './src/config/mysql';

const main = async () => {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany();
    console.table(users.map(u => ({ id: u.id, email: u.email, name: u.name })));

    console.log('\n--- GROUPS ---');
    const groups = await prisma.group.findMany({
        include: { members: { include: { user: true } } }
    });
    groups.forEach(g => {
        console.log(`[${g.id}] ${g.name} (Created by: ${g.createdById})`);
        console.log('   Members:', g.members.map(m => m.user.email).join(', '));
    });

    console.log('\n--- EXPENSES ---');
    const expenses = await prisma.expense.findMany({
        include: { shares: true }
    });
    expenses.forEach(e => {
        console.log(`[${e.id}] ${e.description} - $${e.amount} (Payer: ${e.payerId})`);
        console.log('   Shares:', e.shares.map(s => `User ${s.userId}: $${s.amount}`).join(', '));
    });
};

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
