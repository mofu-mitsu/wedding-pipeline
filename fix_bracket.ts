import * as fs from 'fs';
let code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
code = code.replace(/\{phase === "afterparty" && \(\<\>/g, '{phase === "afterparty" && (');
fs.writeFileSync('src/components/CeremonyStage.tsx', code);
