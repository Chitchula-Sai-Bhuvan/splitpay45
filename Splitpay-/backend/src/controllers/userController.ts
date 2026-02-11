import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as settlementService from '../services/settlementService';
import logger from '../utils/logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, name, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const existing = await userService.findUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const user = await userService.registerUser(email, name || '', password);
        res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
        logger.error('Registration error:', error);
        if (error.message && error.message.includes('already registered')) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await userService.findUserByEmail(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error', details: error });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId as string);
        if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

        // User stats come from settlement/graph logic
        const stats = await settlementService.getUserStats(userId);
        res.json(stats);
    } catch (error) {
        logger.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get user stats' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        logger.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
