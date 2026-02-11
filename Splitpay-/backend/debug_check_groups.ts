import axios from 'axios';

const main = async () => {
    try {
        const res = await axios.get('http://localhost:4000/api/groups?userId=1');
        console.log('Groups Response:', JSON.stringify(res.data, null, 2));
    } catch (error: any) {
        console.error('Error:', error.message);
    }
};

main();
