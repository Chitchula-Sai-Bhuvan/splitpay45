
import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    action: string;
    entity: 'USER' | 'GROUP' | 'EXPENSE' | 'SETTLEMENT';
    entityId: number | string;
    userId?: number;
    details: any;
    timestamp: Date;
}

const AuditLogSchema: Schema = new Schema({
    action: { type: String, required: true },
    entity: { type: String, required: true, enum: ['USER', 'GROUP', 'EXPENSE', 'SETTLEMENT'] },
    entityId: { type: Schema.Types.Mixed, required: true }, // ID from MySQL
    userId: { type: Number }, // Actor
    details: { type: Schema.Types.Mixed }, // Snapshot or metadata
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
