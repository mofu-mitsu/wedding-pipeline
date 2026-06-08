import * as fs from 'fs';
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
const lines = code.split('\n');

for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('</div>') && lines[i+2] && lines[i+2].includes('メインのチャペル壇上')) {
    lines[i] = '          </div>)}'; // Close the ternary
    console.log("Fixed ternary close at line", i+1);
  }
}

fs.writeFileSync('src/components/CeremonyStage.tsx', lines.join('\n'));
