import * as fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  // Let's find exactly the message arrays
  if (lines[i].includes('const messages = [')) {
    // Check if it has '🌸チャッピー' 
    let hasFamily = false;
    for(let j=i; j<i+30; j++) {
      if (lines[j] && lines[j].includes('🌸チャッピー')) {
        hasFamily = true;
        break;
      }
    }
    
    if (hasFamily) {
      // It's the one at 1520
      console.log("Found family messages at App.tsx line: ", i+1);
      
      // Let's replace the single array with a ternary check
      lines[i] = '      const messages = isSecretMismon ? [';
      
      // We need to find the closing `];` for this array
      for(let j=i+1; j<i+50; j++) {
        if (lines[j] && lines[j].trim() === '];') {
          lines[j] = `      ] : [\n        { name: "参列客 A", emoji: "🐰", text: "本当に感動しました！お二人の末永いお幸せをお祈りします！", type: "love", icon: "fa-solid fa-heart" },\n        { name: "参列客 B", emoji: "🐶", text: "最高のお式でした！これからも素敵な思い出を作ってくださいね！", type: "love", icon: "fa-solid fa-star" }\n      ];`;
          break;
        }
      }
    }
  }
}

// Let's also check CeremonyStage.tsx for any unhandled ones!
const cCode = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
// I believe CeremonyStage.tsx is correctly handled, but wait:
// Let's check `CeremonyStage.tsx:582` from my grep output earlier:
// 582:        { sender: "🌙 メア", ... }
fs.writeFileSync('src/App.tsx', lines.join('\n'));
