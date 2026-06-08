import * as fs from 'fs';
let code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');

// The place where it uses phaseMemos is:
// const sourceMessages = phaseMemos[phase] || [];

code = code.replace(
  'const sourceMessages = phaseMemos[phase] || [];',
  'let sourceMessages = phaseMemos[phase] || [];\n    if (!isSecretMismon) {\n      sourceMessages = sourceMessages.filter(m => !["ジェミ", "メア", "チャッピー", "父親", "母親", "芋虫", "防衛隊"].some(n => m.sender.includes(n)));\n    }'
);

fs.writeFileSync('src/components/CeremonyStage.tsx', code);
