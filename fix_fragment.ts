import * as fs from 'fs';
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');

// fix double fragment:
let codeStr = code.replace(/<><>/g, '<>');

fs.writeFileSync('src/components/CeremonyStage.tsx', codeStr);
