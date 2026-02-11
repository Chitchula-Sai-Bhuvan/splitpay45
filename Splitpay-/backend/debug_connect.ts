import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import neo4j from 'neo4j-driver';

const measure = async (name: string, fn: () => Promise<void>) => {
    const start = Date.now();
    try {
        await fn();
        console.log(`✅ ${name} passed (${Date.now() - start}ms)`);
    } catch (e: any) {
        console.error(`❌ ${name} failed:`, e.message);
    }
};

const main = async () => {
    console.log('--- Config ---');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('NEO4J_URI:', process.env.NEO4J_URI);

    // Test MySQL
    await measure('MySQL Connect', async () => {
        const prisma = new PrismaClient();
        await prisma.$connect();
        const userCount = await prisma.user.count();
        console.log(`   User count: ${userCount}`);
        await prisma.$disconnect();
    });

    // Test Neo4j
    await measure('Neo4j Connect', async () => {
        const driver = neo4j.driver(
            process.env.NEO4J_URI!,
            neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!)
        );
        await driver.verifyConnectivity();
        const session = driver.session();
        await session.run('MATCH (n) RETURN count(n) as count');
        await session.close();
        await driver.close();
    });
};

main();
