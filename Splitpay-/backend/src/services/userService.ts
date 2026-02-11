import prisma from '../config/mysql';
import bcrypt from 'bcrypt';
// import driver from '../config/neo4j'; // Removed
import logger from '../utils/logger';
import { logActivity } from '../utils/auditLogger';

export const registerUser = async (email: string, name: string, password: string) => {
    // 1. Hash Password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 2. Create User (SQLite compatible - no SPs)
    logger.info(`Creating user ${email}`);

    const user = await prisma.user.create({
        data: {
            email,
            name,
            passwordHash
        }
    });

    if (!user) throw new Error("User creation failed");

    // 3. Neo4j Sync (DISABLED)
    logger.info(`Skipped Neo4j sync for User ${user.id}`);

    // 4. Audit Log (Mocked)
    await logActivity('USER_REGISTERED', 'USER', user.id, user.id, { email, name });

    return user;
};

export const findUserByEmail = async (email: string) => {
    return prisma.user.findUnique({
        where: { email }
    });
};

export const findUserById = async (id: number) => {
    return prisma.user.findUnique({
        where: { id }
    });
};

export const getAllUsers = async () => {
    return prisma.user.findMany({
        select: { id: true, name: true, email: true }
    });
};
