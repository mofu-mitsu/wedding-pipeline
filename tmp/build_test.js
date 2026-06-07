const fs = require('fs');
fs.writeFileSync('/tmp/test.ts', `
import { readFileSync } from 'fs';
console.log(readFileSync('./src/main.tsx', 'utf-8'));
`);
