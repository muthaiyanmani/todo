#!/usr/bin/env node
const { exec } = require('child_process');

console.log('Running ESLint check...');
exec('npm run lint', (error, stdout, stderr) => {
  if (error) {
    console.error('ESLint errors found:');
    console.error(stdout);
    console.error(stderr);
    process.exit(1);
  } else {
    console.log('✅ ESLint check passed!');
    console.log(stdout);
  }
});