import * as fs from 'fs';

let code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');

// The original file structure:
// <div id="stage-panel">
//   <div className="ceremony-altar-flow ..."> // This only renders if phase !== 'setup'
//   </div>
// </div>

// Right now, at line 1317:
//         ) : (
//           <div className="ceremony-altar-flow space-y-6 w-full animate-fadeIn relative flex flex-col justify-between flex-1">
//             {phase === "afterparty" && (<>
//             {/* ごちそう＆プレゼントボタン群 */} ...

// At 1485:
//             {/* End of after-party block */}
// </>)}
//           
//          {/* メインのチャペル壇上・挙式風景（アフターパーティーを含む挙式の全フェーズで常に表示！） */}

// At 1790:
//                 </div>
//               </div>
//             </div>
//           )}  <-- Wait! This belongs to phase === "afterparty"! I duplicated the afterparty block! 
//           Because I had the script insert `afterpartyComponent` BUT IT WAS ALREADY THERE! 

// Let's remove the duplicated afterparty block!
// Wait! `afterpartyComponent` includes `🧁 SPECIAL PRESENT & CATERING STATION 🎁` to `<span className="text-base animate-bounce">🐛</span><span>お芋虫をプレゼント</span></button></div></div></div>`

// I see! The script INSERTED after-party. BUT the original after-party WAS NOT DELETED!
