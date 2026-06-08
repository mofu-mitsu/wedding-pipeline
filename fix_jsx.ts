import * as fs from 'fs';
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{phase === "afterparty" && (')) {
    // Replace with React Fragment
    lines[i] = '            {phase === "afterparty" && (<>';
  }
  if (lines[i].includes('End of after-party block')) {
    // Actually our script did this:
    // lines.splice(endIndex + 2, 0, '            )}');
    // But let's find that `)}` and turn it to `</>)}`
    // Oh wait, why the `)}` is at the end of the script log?
  }
}

// Just globally replace the added brackets for afterparty
let codeStr = lines.join('\n');
codeStr = codeStr.replace(/\{phase === "afterparty" && \(/g, '{phase === "afterparty" && (<>');
codeStr = codeStr.replace(/End of after-party block.*\n.*\)}/g, 'End of after-party block */}\n</>)}');

// Also remove the stray `)}` at 1795 (from previous view: line 1795:     )})
// Actually, let's find `    )}` that is right before `        {/* Master of Ceremony Broadcast Panel */}`
codeStr = codeStr.replace(/ {4}\)}\n\n {8}\{\/\* Master of Ceremony/g, '\n\n        {/* Master of Ceremony');

// Finally, the end of the file should close the ternary
codeStr = codeStr.replace(/    <\/div>\n  \);\n};\n\nexport default CeremonyStage;/g, '    </div>)}\n  );\n};\n\nexport default CeremonyStage;');

fs.writeFileSync('src/components/CeremonyStage.tsx', codeStr);
