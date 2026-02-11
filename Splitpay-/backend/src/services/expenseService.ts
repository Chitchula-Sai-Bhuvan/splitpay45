import prisma from '../config/mysql';
// import driver from '../config/neo4j'; // Removed
import logger from '../utils/logger';
import { logActivity } from '../utils/auditLogger';

interface ShareInput {
    userId: number;
    amount: number;
}

export const createExpense = async (
    groupId: number,
    payerId: number,
    description: string,
    amount: number,
    shares: ShareInput[]
) => {
    logger.info(`Creating expense: ${description} for ${amount} by ${payerId} in group ${groupId}`);

    // SQLite doesn't support Stored Procedures, so we use a Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create Expense Header
        const expense = await tx.expense.create({
            data: {
                groupId,
                payerId,
                amount,
                description
            }
        });

        // 2. Create Shares
        for (const share of shares) {
            await tx.expenseShare.create({
                data: {
                    expenseId: expense.id,
                    userId: share.userId,
                    amount: share.amount
                }
            });
        }

        // 3. Populate Debt Ledger (Double-Entry)
        // Logic: If Payer paid 100, and User A owes 33, then A -> Payer 33.
        // If Payer is included in shares (paid for self), that 'debt' is self-owed and usually ignored or filtered.
        const ledgerEntries = [];
        for (const share of shares) {
            if (share.userId !== payerId) {
                // User A (share.userId) owes Payer (payerId)
                await tx.debtLedger.create({
                    data: {
                        expenseId: expense.id,
                        groupId: groupId,
                        payerId: share.userId,   // Debtor
                        payeeId: payerId,        // Creditor
                        amount: share.amount,
                        isSettled: false
                    }
                });
            }
        }

        return expense;
    });

    // Fetch full object for return
    const fullExpense = await prisma.expense.findUnique({
        where: { id: result.id },
        include: {
            payer: { select: { id: true, name: true } },
            shares: { include: { user: { select: { id: true, name: true } } } }
        }
    });

    if (!fullExpense) throw new Error("Failed to fetch created expense");

    // 4. Audit Log (Mocked)
    await logActivity('EXPENSE_ADDED', 'EXPENSE', fullExpense.id, payerId, {
        amount,
        description,
        groupId,
        actorName: fullExpense.payer?.name || 'Unknown'
    });

    return fullExpense;
};

export const getGroupExpenses = async (groupId: number) => {
    return prisma.expense.findMany({
        where: { groupId },
        include: {
            payer: { select: { id: true, name: true } },
            shares: { include: { user: { select: { id: true, name: true } } } }
        },
        orderBy: { createdAt: 'desc' }
    });
};
