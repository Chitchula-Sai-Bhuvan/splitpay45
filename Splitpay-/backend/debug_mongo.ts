import mongoose from 'mongoose';
import 'dotenv/config';

const main = async () => {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/splitpay';
    console.log(`Connecting to MongoDB at ${uri}...`);

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected successfully!');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n--- Collections ---');
        console.table(collections.map(c => ({ name: c.name, type: c.type })));

        // Check Audit Logs
        const collectionName = 'audit_logs';
        // Note: Mongoose might pluralize differently, checking raw first
        const auditCollection = mongoose.connection.collection(collectionName);
        const count = await auditCollection.countDocuments();

        console.log(`\n--- Data in '${collectionName}' (${count} records) ---`);

        if (count > 0) {
            const logs = await auditCollection.find().sort({ timestamp: -1 }).limit(5).toArray();
            logs.forEach(log => {
                console.log(`[${log.timestamp}] ${log.action} by User ${log.userId} (Entity: ${log.entityId})`);
                console.log(`   Details:`, JSON.stringify(log.details));
            });
        } else {
            console.log("No audit logs found yet.");
        }

    } catch (error: any) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected.');
    }
};

main();
