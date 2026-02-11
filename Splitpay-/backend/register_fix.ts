import 'dotenv/config';
import { registerUser } from './src/services/userService';

const main = async () => {
    try {
        console.log('Registering user...');
        const user = await registerUser('sbvn.skl@gmail.com', 'SBVN User', 'password123');
        console.log('User registered:', user);
    } catch (e: any) {
        console.log('Registration error (might already exist):', e.message || e);
    }
};

main();
