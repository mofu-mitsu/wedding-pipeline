import * as fs from 'fs';
const code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('⚙️ クラウド同期用：自作 Google Apps Script (GAS) 連携設定'));
if (startIdx !== -1) {
  // Find the exact outer div
  let divStart = startIdx;
  while(divStart > 0 && !lines[divStart].includes('<div className="border border-slate-200 bg-white')) {
    divStart--;
  }
  
  // The block ends around 1838
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('                </div> {/* /.max-w-md */}'));
  
  if (endIdx !== -1) {
    // We want to delete from divStart to the div closing before endIdx
    lines.splice(divStart, endIdx - divStart);
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
