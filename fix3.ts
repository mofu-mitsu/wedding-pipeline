import * as fs from 'fs';
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
const lines = code.split('\n');

// 1. Find the incorrect ternary close I added
for(let i=0; i<lines.length; i++) {
  if (lines[i] === '          </div>)}') {
    lines[i] = '          </div>)}'; // removing the `)}` is not right. Wait, the `afterparty` block should be closed with `)}` if it was started with a condition!
  }
}
