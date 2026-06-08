import * as fs from 'fs';
let code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Persistent Utility Buttons */}')) {
    // We close ceremony-altar-flow and the setup ternary right before utility buttons!
    // But wait, the utility buttons should be outside the setup ternary?
    // Let's insert the closing tags before utility buttons:
    lines.splice(i, 0, '    </div>)}');
    break;
  }
}

// Then we fix the end of the file to close 1264 and 1166!
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('    </div>)}')) { // My previous broken end
    lines[i] = '      </div>\n    </div>'; 
    break;
  }
}

fs.writeFileSync('src/components/CeremonyStage.tsx', lines.join('\n'));
