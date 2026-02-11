
import 'dotenv/config';
import prisma from './src/config/mysql';
import { connectMongo } from './src/config/mongo';
import { connectNeo4j, driver } from './src/config/neo4j';
import bcrypt from 'bcrypt';

async function diagnose() {
    console.log('--- Starting Diagnosis ---');

    // 1. Check MongoDB
    try {
        console.log('Testing MongoDB Connection...');
        await connectMongo();
        console.log('✅ MongoDB Connected');
    } catch (e: any) {
        console.error('❌ MongoDB Failed:', e.message);
    }

    // 2. Check Neo4j
    try {
        console.log('Testing Neo4j Connection...');
        await connectNeo4j();
        const session = driver.session();
        await session.run('MATCH (n) RETURN count(n) AS count');
        await session.close();
        console.log('✅ Neo4j Connected');
    } catch (e: any) {
        console.error('❌ Neo4j Failed:', e.message);
    }

    // 3. Check MySQL & Procedure
    try {
        console.log('Testing MySQL Connection...');
        const userCount = await prisma.user.count();
        console.log(`✅ MySQL Connected (Users: ${userCount})`);

        // Test Procedure
        console.log('Testing sp_create_user procedure...');
        const testEmail = `test_${Date.now()}@example.com`;
        const testPass = 'password';
        const hash = await bcrypt.hash(testPass, 10);

        await prisma.$queryRaw`CALL sp_create_user(${testEmail}, 'Test User', ${hash}, @newUserId);`;
        console.log('✅ Procedure Execution Successful');

        const created = await prisma.user.findUnique({ where: { email: testEmail } });
        if (created) {
            console.log('✅ User Verification Successful:', created.id);
            // Cleanup
            await prisma.user.delete({ where: { email: testEmail } });
            console.log('✅ Cleanup Successful');
        } else {
            console.error('❌ User created but not found in DB');
        }

    } catch (e: any) {
        console.error('❌ MySQL/Prisma Failed:', e.message);
    }

    console.log('--- Diagnosis Complete ---');
    process.exit(0);
}

diagnose();
