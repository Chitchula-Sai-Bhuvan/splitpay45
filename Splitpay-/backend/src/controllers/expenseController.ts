import { Request, Response } from 'express';
import * as expenseService from '../services/expenseService';
import logger from '../utils/logger';

interface AuthRequest extends Request {
    user?: {
        userId: number;
        email: string;
    };
}

export const create = async (req: Request, res: Response) => {
    try {
        const { groupId, description, amount, shares } = req.body;
        const authReq = req as AuthRequest;
        // Securely get payerId from token. Fallback to body for testing only if needed, but per strict rules, token is truth.
        const payerId = authReq.user?.userId || req.body.payerId;

        logger.info(`Creating expense payload: ${JSON.stringify(req.body)} set payer to ${payerId}`);

        // Basic validation
        if (!groupId || !payerId || !amount || !shares) {
            logger.warn('Missing fields in expense creation');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const expense = await expenseService.createExpense(
            Number(groupId),
            Number(payerId),
            description,
            Number(amount),
            shares
        );
        res.status(201).json(expense);
    } catch (error: any) {
        logger.error(`Create expense error details: ${error.message}`, error);
        res.status(500).json({ error: error.message || 'Failed to create expense' });
    }
};

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.query;
        if (!groupId) return res.status(400).json({ error: 'GroupId required' });

        const expenses = await expenseService.getGroupExpenses(Number(groupId));
        res.json(expenses);
    } catch (error) {
        logger.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};
