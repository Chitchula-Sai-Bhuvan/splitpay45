const { exec } = require('child_process');
const fs = require('fs');

const env = { ...process.env, DATABASE_URL: "mysql://root:root@localhost:3306/SplitPayDB" };

exec('npx prisma generate', { cwd: process.cwd(), env: env }, (error, stdout, stderr) => {
    const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nERROR:\n${error ? error.message : 'None'}`;
    fs.writeFileSync('prisma_debug.log', output);
    console.log('Finished writing log');
});
