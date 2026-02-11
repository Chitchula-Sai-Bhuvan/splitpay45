import { Request, Response } from 'express';
import * as groupService from '../services/groupService';
import logger from '../utils/logger';

interface AuthRequest extends Request {
    user?: {
        userId: number;
        email: string;
    };
}

export const create = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        // userId from token (secure) or body (legacy/debug)
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId || req.body.userId;

        if (!name || !userId) return res.status(400).json({ error: 'Name and userId required' });

        const group = await groupService.createGroup(name, userId);
        res.status(201).json(group);
    } catch (error) {
        logger.error('Create group error:', error);
        res.status(500).json({ error: 'Failed to create group' });
    }
};

export const getMyGroups = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;

        if (!userId) return res.status(401).json({ error: 'User not authenticated' });

        const groups = await groupService.getUserGroups(Number(userId));
        res.json(groups);
    } catch (error) {
        logger.error('Get groups error:', error);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
};

export const addMember = async (req: Request, res: Response) => {
    try {
        const { groupId, email } = req.body;
        const authReq = req as AuthRequest;
        const actorId = authReq.user?.userId; // Who is adding the member?

        const user = await groupService.addMember(Number(groupId), email, actorId);
        res.json(user);
    } catch (error: any) {
        if (error.message && error.message.includes('User with this email not found')) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (error.message && error.message.includes('already a member')) {
            return res.status(409).json({ error: 'User is already a member of this group' });
        }
        logger.error('Add member error:', error);
        res.status(500).json({ error: error.message || 'Failed to add member' });
    }
};
