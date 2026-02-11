
// import AuditLog from '../models/AuditLog'; // Removed
import logger from './logger';

export const logActivity = async (
    action: string,
    entity: 'USER' | 'GROUP' | 'EXPENSE' | 'SETTLEMENT',
    entityId: number | string,
    userId: number | undefined,
    details: any
) => {
    try {
        // Disabled Mongo logging
        /*
        await AuditLog.create({
            action,
            entity,
            entityId,
            userId,
            details,
            timestamp: new Date()
        });
        */
        logger.info(`📝 (Mock) Audit Logged: ${action} on ${entity} ${entityId}`);
    } catch (error) {
        // logger.error('Failed to write to Audit Log (Mongo):', error);
    }
};
