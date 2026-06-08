import * as fs from 'fs';
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
let lines = code.split('\n');

for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('</div>)}') && lines[i+2] && lines[i+2].includes('メインのチャペル壇上')) {
    // 1484 is '          </div>)}'
    // Change this back to what it should be (the end of the afterparty food buttons)
    // Wait, the afterparty was NOT conditionally rendered inside ceremony-altar-flow in my block.
    // I should just wrap it: \n {phase === "afterparty" && ( ... )}
    
    // BUT wait! Does my block HAVE to close?
    // Let's remove the </div>)} entirely!
    lines[i] = '            {/* End of after-party block */}';
    
    // Now we must close ceremony-altar-flow correctly at the end.
    // Where is the end of the ceremony-altar-flow? Let's trace from bottom.
    // The very end of CeremonyStage component:
    break;
  }
}

// 2. Wrap the afterparty part conditionally.
const startIndex = lines.findIndex(l => l.includes('ごちそう＆プレゼントボタン群'));
const endIndex = lines.findIndex(l => l.includes('End of after-party block'));

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, 0, '            {phase === "afterparty" && (');
  lines.splice(endIndex + 2, 0, '            )}');
}

// 3. Let's look at the very end of the file to fix the closing brace
// The main component should end properly.
let tailLines = lines.slice(-20);
console.log("TAIL:");
console.log(tailLines.join('\n'));

fs.writeFileSync('src/components/CeremonyStage.tsx', lines.join('\n'));
