import prisma from '../config/mysql';
// import driver from '../config/neo4j'; // Removed
import logger from '../utils/logger';
import { logActivity } from '../utils/auditLogger';

export const createGroup = async (name: string, userId: number) => {
    // 1. Create Group and add creator as member
    const group = await prisma.group.create({
        data: {
            name,
            createdById: userId,
            members: {
                create: {
                    userId,
                    role: 'ADMIN'
                }
            }
        },
        include: { createdBy: true }
    });

    if (!group) throw new Error("Group creation failed");

    // 2. Neo4j: (DISABLED)
    logger.info(`Skipped Neo4j sync for Group ${group.id}`);

    // 3. Audit Log
    await logActivity('GROUP_CREATED', 'GROUP', group.id, userId, {
        name: group.name,
        actorName: group.createdBy?.name || 'Unknown'
    });

    return group;
};

export const getUserGroups = async (userId: number) => {
    return prisma.group.findMany({
        where: {
            members: {
                some: { userId }
            }
        },
        include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } }
        }
    });
};

export const addMember = async (groupId: number, email: string, actorId?: number) => {
    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User with this email not found');

    // 2. Add to Group
    const membership = await prisma.groupMember.upsert({
        where: {
            groupId_userId: {
                groupId,
                userId: user.id
            }
        },
        update: {}, // Do nothing if already exists
        create: {
            groupId,
            userId: user.id,
            role: 'MEMBER'
        }
    });

    // 3. Neo4j: (DISABLED)
    logger.info(`Skipped Neo4j sync for member addition`);

    // Fetch Actor Name for Audit
    let actorName = 'System';
    if (actorId) {
        const actor = await prisma.user.findUnique({ where: { id: actorId } });
        if (actor) actorName = actor.name || 'Unknown';
    }

    // Audit Log
    await logActivity('MEMBER_ADDED', 'GROUP', groupId, actorId || 0, {
        email,
        actorName
    });

    return user;
};
