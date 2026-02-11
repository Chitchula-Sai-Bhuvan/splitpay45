const mongoose = require('mongoose');
require('dotenv').config();

const main = async () => {
    // Force IPv4 if needed
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/splitpay';
    console.log(`Connecting to ${uri}...`);

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected successfully!');

        const count = await mongoose.connection.collection('audit_logs').countDocuments();
        console.log(`Found ${count} audit logs.`);

        if (count > 0) {
            const logs = await mongoose.connection.collection('audit_logs').find().sort({ timestamp: -1 }).limit(3).toArray();
            console.log('Latest logs:');
            console.log(JSON.stringify(logs, null, 2));
        }

    } catch (e) {
        console.error('❌ Failed:', e.message);
    } finally {
        await mongoose.disconnect();
    }
};

main();
