const { exec } = require('child_process');
const fs = require('fs');

exec('npx tsc --noEmit', { cwd: process.cwd() }, (error, stdout, stderr) => {
    const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n\nERROR:\n${error ? error.message : 'None'}`;
    fs.writeFileSync('tsc_debug.log', output);
    console.log('Finished writing tsc log');
});
