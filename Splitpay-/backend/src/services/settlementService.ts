import prisma from '../config/mysql';
// import driver from '../config/neo4j'; // Removed
import logger from '../utils/logger';
import { logActivity } from '../utils/auditLogger';

// Greedy debt minimization algorithm (TypeScript Version)
export const getSuggestedSettlements = async (groupId: number) => {
    try {
        // 1. Fetch all unsettled debts from Ledger
        // If groupId is 0, fetch global (all groups)
        const whereClause = groupId === 0 ? { isSettled: false } : { groupId, isSettled: false };

        const debts = await prisma.debtLedger.findMany({
            where: whereClause
        });

        // 2. Calculate Net Balances
        const balances: Record<number, number> = {};

        debts.forEach(d => {
            const amount = Number(d.amount);
            // Payer (in Ledger) is the DEBTOR (owes money)
            balances[d.payerId] = (balances[d.payerId] || 0) - amount;
            // Payee (in Ledger) is the CREDITOR (is owed money)
            balances[d.payeeId] = (balances[d.payeeId] || 0) + amount;
        });

        // Also subtract strict Settlements if we want to reflect partial payments that haven't cleared specific ledger rows yet?
        // For MVP simplicity: We assume Settlements clear debts. 
        // But since we didn't link Settlements to Ledger rows yet, we might double count if we aren't careful.
        // Let's rely on the fact that 'settleDebt' should ideally mark rows as settled.
        // For now, let's just return the graph of currently open ledger entries.

        // 3. Separate into Debtors and Creditors
        let debtors = Object.keys(balances)
            .filter(k => balances[Number(k)] < -0.01)
            .map(k => ({ id: Number(k), amount: balances[Number(k)] }));

        let creditors = Object.keys(balances)
            .filter(k => balances[Number(k)] > 0.01)
            .map(k => ({ id: Number(k), amount: balances[Number(k)] }));

        // 4. Sort by magnitude
        debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
        creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

        const suggestions = [];
        let i = 0;
        let j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            // The amount to settle is Min(|debtor|, creditor)
            const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

            suggestions.push({
                payerId: debtor.id,
                payeeId: creditor.id,
                amount: Number(amount.toFixed(2))
            });

            // Update remaining
            debtor.amount += amount;
            creditor.amount -= amount;

            // Move pointer if settled
            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        return suggestions;

    } catch (error) {
        logger.error('Error calculating settlements (TS):', error);
        throw error;
    }
};

export const getSuggestedSettlementsSQL = getSuggestedSettlements; // Alias

export const settleDebt = async (payerId: number, payeeId: number, amount: number) => {
    // 1. Create Settlement Record
    const settlement = await prisma.settlement.create({
        data: {
            payerId,
            payeeId,
            amount
        },
        include: { payer: true, payee: true }
    });

    // 2. Clear relevant DebtLedger entries (FIFO / Best Match)
    // This is complex. For SQLite MVP, we might just leave them 'unsettled' but add a Settlement entry.
    // Ideally, we should find rows: Payer -> Payee and mark strict matches as isSettled=true.
    // Or reduce their 'amount'.
    // For now, just logging the payment. Refinement needed for full double-entry clearing.

    logger.info(`Settlement recorded: ${payerId} paid ${payeeId} ${amount}`);

    // Audit Log (Mocked)
    await logActivity('SETTLEMENT_RECORDED', 'SETTLEMENT', settlement.id, payerId, {
        payeeId,
        amount,
        payerName: settlement.payer?.name || 'Unknown',
        payeeName: settlement.payee?.name || 'Unknown'
    });

    return settlement;
};

export const getRawGraph = async () => {
    // Return simple graph from Ledger
    const debts = await prisma.debtLedger.findMany({ where: { isSettled: false } });
    const nodesMap = new Map();
    const links: any[] = [];

    debts.forEach(r => {
        const uId = r.payerId;
        const vId = r.payeeId;

        if (!nodesMap.has(uId)) nodesMap.set(uId, { id: uId, name: `User ${uId}`, val: 1 });
        if (!nodesMap.has(vId)) nodesMap.set(vId, { id: vId, name: `User ${vId}`, val: 1 });

        links.push({
            source: uId,
            target: vId,
            amount: Number(r.amount)
        });
    });

    return {
        nodes: Array.from(nodesMap.values()),
        links
    };
};

export const getUserStats = async (userId: number) => {
    try {
        // Calculate Total You Owe
        // Sum of all Ledger entries where you are Payer (Debtor)
        const debts = await prisma.debtLedger.aggregate({
            _sum: { amount: true },
            where: { payerId: userId, isSettled: false }
        });

        // Sum of all Ledger entries where you are Payee (Creditor)
        const credits = await prisma.debtLedger.aggregate({
            _sum: { amount: true },
            where: { payeeId: userId, isSettled: false }
        });

        // Get Active Groups Count
        const activeGroups = await prisma.group.count({
            where: { members: { some: { userId: Number(userId) } } }
        });

        return {
            totalYouOwe: Number(debts._sum.amount || 0),
            totalOwedToYou: Number(credits._sum.amount || 0),
            activeGroups,
            debts: [], // Detailed list todo
            credits: []
        };
    } catch (error) {
        logger.error('Error fetching user stats:', error);
        return { totalYouOwe: 0, totalOwedToYou: 0, activeGroups: 0, debts: [], credits: [] };
    }
};
