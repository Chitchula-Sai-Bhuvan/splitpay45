import { Request, Response } from 'express';
import * as settlementService from '../services/settlementService';
import logger from '../utils/logger';

export const getGraph = async (req: Request, res: Response) => {
    try {
        const graph = await settlementService.getRawGraph();
        res.json(graph);
    } catch (error) {
        logger.error('Get graph error:', error);
        res.status(500).json({ error: 'Failed to get graph' });
    }
};

export const getSuggestions = async (req: Request, res: Response) => {
    try {
        const suggestions = await settlementService.getSuggestedSettlements(0); // 0 for global/all groups for now
        res.json(suggestions);
    } catch (error) {
        logger.error('Get suggestions error:', error);
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
};

interface AuthRequest extends Request {
    user?: {
        userId: number;
        email: string;
    };
}

export const settle = async (req: Request, res: Response) => {
    try {
        const { payeeId, amount } = req.body;
        const authReq = req as AuthRequest;
        // Payer MUST be the logged in user
        const payerId = authReq.user?.userId || req.body.payerId;

        if (!payerId || !payeeId || !amount) return res.status(400).json({ error: 'Msising fields' });

        const result = await settlementService.settleDebt(payerId, payeeId, Number(amount));
        res.status(201).json(result);
    } catch (error) {
        logger.error('Settle error:', error);
        res.status(500).json({ error: 'Failed to settle debt' });
    }
};
