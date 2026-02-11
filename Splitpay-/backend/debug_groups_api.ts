import axios from 'axios';
import jwt from 'jsonwebtoken';

const main = async () => {
    try {
        // 1. Generate a valid token (simulating login)
        const secret = process.env.JWT_SECRET || 'secret';
        const token = jwt.sign({ userId: 1, email: 'alice@example.com' }, secret, { expiresIn: '1h' });
        console.log("Generated Token:", token);

        // 2. Make Request
        const url = 'http://localhost:4000/api/groups?userId=1';
        console.log(`GET ${url}`);

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Response Status:", response.status);
        console.log("Response Data:", JSON.stringify(response.data, null, 2));

    } catch (error: any) {
        console.error("Request Failed:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
};

main();
