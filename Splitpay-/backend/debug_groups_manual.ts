import { getUserGroups } from './src/services/groupService';
import prisma from './src/config/mysql';

const main = async () => {
    try {
        console.log("Fetching groups for user 1...");
        const groups = await getUserGroups(1);
        console.log("Groups:", JSON.stringify(groups, null, 2));
    } catch (error) {
        console.error("Error fetching groups:", error);
    } finally {
        await prisma.$disconnect();
    }
};

main();
