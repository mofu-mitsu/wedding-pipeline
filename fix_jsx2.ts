import * as fs from 'fs';
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');

let codeStr = code.replace(/\{\/\* End of after-party block \*\/\}\*\//g, '{/* End of after-party block */}');

fs.writeFileSync('src/components/CeremonyStage.tsx', codeStr);
