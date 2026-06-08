import * as fs from 'fs';
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
const lines = code.split('\n');

for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('              </div>') && lines[i+2] && lines[i+2].includes('ごちそう＆プレゼントボタン群')) {
    console.log("Matched at line: ", i+1);
    // line i is 1455
    lines.splice(i+1, 0, '            </div>)}'); // close 1435 and 1434
    break;
  }
}

fs.writeFileSync('src/components/CeremonyStage.tsx', lines.join('\n'));
