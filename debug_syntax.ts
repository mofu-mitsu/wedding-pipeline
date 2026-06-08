import * as fs from 'fs';
import * as babel from '@babel/core';

// Let's just fix it by examining the file
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
// Just print around 1166 and 1793 and 1989
const lines = code.split('\n');
console.log("--- 1160 to 1175 ---");
console.log(lines.slice(1160, 1175).map((l,i) => `${i+1161}: ${l}`).join('\n'));
console.log("--- 1785 to 1795 ---");
console.log(lines.slice(1785, 1795).map((l,i) => `${i+1786}: ${l}`).join('\n'));
console.log("--- 1980 to 1995 ---");
console.log(lines.slice(1980, 1995).map((l,i) => `${i+1981}: ${l}`).join('\n'));
console.log("--- End of file ---");
console.log(lines.slice(-10).map((l,i) => `${lines.length-10+i+1}: ${l}`).join('\n'));
