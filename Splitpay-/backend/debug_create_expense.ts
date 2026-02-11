import axios from 'axios';

const main = async () => {
    try {
        // 1. Login to get token (if needed, but for now assuming direct API access or simplified dev env)
        // Actually the backend might verify token? logic says mock for now in controller comments?
        // Controller said: "// Mock Auth Middleware needs to provide userId via req.body..."
        // So we can just POST directly.

        // 2. Get Group ID (assuming one exists from seed/previous usage)
        const groupsRes = await axios.get('http://localhost:4000/api/groups?userId=1'); // Alice
        const group = groupsRes.data[0];
        if (!group) throw new Error('No groups found for Alice');

        console.log('Using Group:', group.id, group.name);

        // 3. Create Expense
        const payload = {
            groupId: group.id,
            payerId: 1, // Alice
            description: 'Test Expense',
            amount: 100,
            shares: [
                { userId: 1, amount: 100 } // Simple self-expense or we need members?
            ]
        };

        // If members exist, split
        if (group.members && group.members.length > 0) {
            payload.shares = group.members.map((m: any) => ({
                userId: m.user.id,
                amount: 100 / group.members.length
            }));
        }

        console.log('Payload:', JSON.stringify(payload, null, 2));

        const res = await axios.post('http://localhost:4000/api/expenses', payload);
        console.log('Success:', res.data);

    } catch (error: any) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

main();
