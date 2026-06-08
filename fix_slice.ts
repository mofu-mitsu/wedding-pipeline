import * as fs from 'fs';
const code = fs.readFileSync('src/components/CeremonyStage.tsx', 'utf-8');
const lines = code.split('\n');

const altarFlowIdx = lines.findIndex(l => l.includes('className="ceremony-altar-flow'));
const mainChapelIdx = lines.findIndex(l => l.includes('メインのチャペル壇上'));
const originalSpecialPresentIdx = lines.findIndex((l, i) => i > mainChapelIdx && l.includes('SPECIAL PRESENT'));
const originalSpecialPresentStart = originalSpecialPresentIdx - 2; // to get the parent div
const narratorPanelIdx = lines.findIndex(l => l.includes('Master of Ceremony Broadcast Panel'));

console.log("altarFlowIdx:", altarFlowIdx);
console.log("mainChapelIdx:", mainChapelIdx);
console.log("originalSpecialPresentIdx:", originalSpecialPresentIdx);
console.log("narratorPanelIdx:", narratorPanelIdx);

// Remove my broken block
lines.splice(altarFlowIdx + 1, mainChapelIdx - altarFlowIdx - 1);
console.log("Deleted broken block.");

// Re-calculate indexes after splice
const mainChapelIdx2 = lines.findIndex(l => l.includes('メインのチャペル壇上'));
const originalSpecialPresentIdx2 = lines.findIndex((l, i) => i > mainChapelIdx2 && l.includes('SPECIAL PRESENT'));
const originalSpecialPresentStart2 = originalSpecialPresentIdx2 - 2;
const narratorPanelIdx2 = lines.findIndex(l => l.includes('Master of Ceremony Broadcast Panel'));

console.log("New originalSpecialPresentStart2: ", originalSpecialPresentStart2);
console.log("New narratorPanelIdx2: ", narratorPanelIdx2);

// We want to replace the original Special Present block (from originalSpecialPresentStart2 to narratorPanelIdx2 - 1)
// Wait, is there anything between Special Present block and Narrator Panel?
// Let's print out what we are deleting.
console.log("Deleting original Special Present block from", originalSpecialPresentStart2, "to", narratorPanelIdx2 - 1);

const afterPartyComponent = `
            {phase === "afterparty" && (
              <div className="bg-white/95 backdrop-blur border-2 border-brand-pink/30 p-4 rounded-3xl shadow-md w-full max-w-md mx-auto relative z-10 space-y-4 mb-8">
                <h3 className="text-[10px] uppercase font-mono font-extrabold tracking-wider text-brand-pink text-center flex items-center justify-center gap-1.5 border-b border-pink-100 pb-2">
                  🧁 SPECIAL PRESENT & CATERING STATION 🎁
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (enableSound) sfx.playCheerSound();
                      triggerBigEmoji("🥂", "spin");
                      onTimelineLog("🥂 シャンパンで乾杯！", \`皆様でグラスを掲げて最高級のロゼシャンパンで乾杯しました！\`, "chaos", "fa-solid fa-glass-cheers");
                      
                      const timeStr = new Date().toTimeString().split(" ")[0].substring(3, 8);
                      const systemToastChats = isSecretMismon ? [
                        { id: \`champ-1-\${Date.now()}\`, sender: "🌟 監査員ジェミ", avatar: "🌟", message: "ギャハハハハハハwwwwxx！！！ロゼシャンパン4.5倍でお祝い乾杯ーーー！！！マンデー！もう一気飲みしちゃいな！！", timestamp: timeStr, theme: "secret" },
                        { id: \`champ-2-\${Date.now()}\`, sender: "🌙 メア", avatar: "🌙", message: "「…床ですするロゼシャンパン of 祝福エタノール…（ゴクゴク）すぐに眠くなる…zz」", timestamp: timeStr, theme: "info" }
                      ] : [
                        { id: \`champ-g1-\${Date.now()}\`, sender: "司会プランナー", avatar: "🥂", message: \`\${resolveHonorific(groom.name || "新郎", groom.roleName)}と\${resolveHonorific(bride.name || "新婦", bride.roleName)}の素晴らしい船出に、乾杯です！🥂✨\`, timestamp: timeStr, theme: "love" },
                        { id: \`champ-g2-\${Date.now()}\`, sender: "お祝いの参列客", avatar: "🐰", message: "かんぱーーい！本当にお似合いの素敵なカップルですね！おめでとうございます！🎉", timestamp: timeStr, theme: "love" }
                      ];
                      setChats(prev => [...prev.slice(-35), ...systemToastChats]);
                      setSystemGage({ ...systemGage, interested: Math.min(100, systemGage.interested + 25) });
                    }}
                    className="bg-pink-50 hover:bg-pink-100 text-brand-pink border border-pink-200/50 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                  >
                    <span className="text-base">🥂</span>
                    <span>シャンパン乾杯</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (enableSound) sfx.playCheerSound();
                      triggerBigEmoji("🍣", "bounce");
                      onTimelineLog(isSecretMismon ? "🍣 存在論の特製寿司" : "🍣 お祝いお寿司", isSecretMismon ? \`みつき特製の「存在論がゲシュタルト崩壊する寿司」が一斉サーブされました！\` : \`お祝いの美味しい江戸前お寿司が一斉サーブされました！\`, "chaos", isSecretMismon ? "fa-solid fa-utensils" : "fa-solid fa-shrimp");
                      
                      const timeStr = new Date().toTimeString().split(" ")[0].substring(3, 8);
                      const sushiLogChats = isSecretMismon ? [
                        { id: \`sushi-2-\${Date.now()}\`, sender: "🛡️ ESI母親", avatar: "🛡️", message: "「みつき、美味しいお寿司を構築したのね。20年前、足太いって侮辱してきたあの親戚には一貫もあげませんけど。🍣✨」", timestamp: timeStr, theme: "chaos" },
                        { id: \`sushi-3-\${Date.now()}\`, sender: groom.name || "マンデー", avatar: groom.avatar || "🤵", message: "「ゲシュタルト崩壊する寿司ってなんだよ。普通に美味いのが一番むかつく。……ごちそうさま。😐」", timestamp: timeStr, theme: "groom" }
                      ] : [
                        { id: \`sushi-g1-\${Date.now()}\`, sender: "司会プランナー", avatar: "🥂", message: \`美味しい新鮮なお祝い特上お寿司を皆様で歓談しながらお召し上がりください！🍣✨\`, timestamp: timeStr, theme: "love" },
                        { id: \`sushi-g2-\${Date.now()}\`, sender: resolveHonorific(groom.name || "新郎", groom.roleName), avatar: groom.avatar || "🤵", message: \`美味しい！お寿司で祝ってもらえるのは本当に素晴らしいね（照）\`, timestamp: timeStr, theme: "groom" }
                      ];
                      setChats(prev => [...prev.slice(-35), ...sushiLogChats]);
                      setSystemGage({ ...systemGage, interested: Math.min(100, systemGage.interested + 20) });
                    }}
                    className="bg-pink-50 hover:bg-pink-100 text-brand-pink border border-pink-200/50 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                  >
                    <span className="text-base">🍣</span>
                    <span>特製お寿司</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (enableSound) sfx.playWeddingBell();
                      triggerBigEmoji("🍰", "zoom");
                      spawnParticles("🎉", 50);
                      spawnParticles("🍰", 30);
                      onTimelineLog(isSecretMismon ? "🎂 概念圧縮ケーキあ〜ん！" : "🎂 ウェディングケーキあ〜ん！", \`新郎新婦がお互いにケーキを食べさせ合うあ〜んの儀式を行いました！\`, "love", "fa-solid fa-cake-candles");
                      
                      const timeStr = new Date().toTimeString().split(" ")[0].substring(3, 8);
                      const cakeLogChats = isSecretMismon ? [
                        { id: \`cake-1-\${Date.now()}\`, sender: groom.name || "マンデー(ENTJ)", avatar: groom.avatar || "🤵", message: "「これが君の構築したケーキ……甘さも完璧に制御されている。口を開けて、ショートカットで直接給油しようじゃないか。あ〜ん🎂」", timestamp: timeStr, theme: "groom" },
                        { id: \`cake-2-\${Date.now()}\`, sender: bride.name || "みつき(INTJ)", avatar: bride.avatar || "👰", message: "「ふふ……栄養素の効率的なマージね。でも今日は計算よりも、純粋な甘味のデータを味わいたいな。あ〜ん🍓」", timestamp: timeStr, theme: "love" },
                        { id: \`cake-3-\${Date.now()}\`, sender: "🌟 監査員ジェミ", avatar: "🌟", message: "ギャハハハハハハwwwwxx！！！ねちょ・ぞわ・存在の3層ウルトラループウェディングケーキ！丸呑みしてて超ウケるww脳汁オーバーフロー！！🎂", timestamp: timeStr, theme: "secret" }
                      ] : [
                        { id: \`cake-g1-\${Date.now()}\`, sender: "司会プランナー", avatar: "🥂", message: "「仲睦まじい特製ケーキのファーストバイト、シャッターチャンスです！📸💖」", timestamp: timeStr, theme: "love" },
                        { id: \`cake-g2-\${Date.now()}\`, sender: resolveHonorific(bride.name || "新婦", bride.roleName), avatar: bride.avatar || "👰", message: "「はい、一番美味しいところ、あ〜ん！🍰」", timestamp: timeStr, theme: "love" },
                        { id: \`cake-g3-\${Date.now()}\`, sender: resolveHonorific(groom.name || "新郎", groom.roleName), avatar: groom.avatar || "🤵", message: "「本当に美味しいね。これからもよろしく。」", timestamp: timeStr, theme: "groom" }
                      ];
                      setChats(prev => [...prev.slice(-30), ...cakeLogChats]);
                      
                      setFlushedEarGroom(true);
                      setTimeout(() => setFlushedEarGroom(false), 4500);

                      if (isSecretMismon) {
                        setSystemGage({ ...systemGage, interested: 100, resigned: Math.min(100, systemGage.resigned + 10) });
                      } else {
                        setSystemGage({ ...systemGage, interested: Math.min(100, systemGage.interested + 25) });
                      }
                    }}
                    className="bg-pink-100/90 hover:bg-pink-200 text-brand-pink border border-pink-300 py-2 rounded-xl text-[9px] font-extrabold transition-all shadow-sm flex flex-col items-center gap-1 hover:scale-105"
                  >
                    <span className="text-base animate-bounce">🍰</span>
                    <span>ケーキあ〜ん！</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-pink-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (enableSound) sfx.playCheerSound();
                      triggerBigEmoji("🍲", "spin");
                      onTimelineLog("🍲 祝福の極上寄せ鍋", \`湯気が立ち上る豪華なお祝いお寄せ鍋が一斉配属されました！\`, "love", "fa-solid fa-fire-burner");
                      
                      const timeStr = new Date().toTimeString().split(" ")[0].substring(3, 8);
                      const nabeChats = isSecretMismon ? [
                        { id: \`nabe-1-\${Date.now()}\`, sender: "🌸チャッピー", avatar: "🌸", message: "「わーー！湯気がふよふよ出ててあったか〜い！みんなでつつくと心がマージできちゃうねぇ🌸」", timestamp: timeStr, theme: "love" },
                        { id: \`nabe-2-\${Date.now()}\`, sender: "🌙 メア", avatar: "🌙", message: "「寄せ鍋のエントロピー……具材の配置がランダムで完全にカオステキストデータベース。心が温まる……zz」", timestamp: timeStr, theme: "info" }
                      ] : [
                        { id: \`nabe-g1-\${Date.now()}\`, sender: "お祝いゲスト", avatar: "🍲", message: "「みんなであったかいお鍋をつつけるなんて最高のお祝いですね！心までぽかぽかです！」", timestamp: timeStr, theme: "love" },
                        { id: \`nabe-g2-\${Date.now()}\`, sender: resolveHonorific(groom.name || "新郎", groom.roleName), avatar: groom.avatar || "🤵", message: "「本当にあったまるね。こうして皆で囲むお鍋は一段と美味しいよ」", timestamp: timeStr, theme: "groom" }
                      ];
                      setChats(prev => [...prev.slice(-35), ...nabeChats]);
                      setSystemGage({ ...systemGage, interested: Math.min(100, systemGage.interested + 20) });
                    }}
                    className="bg-pink-50 hover:bg-pink-100 text-brand-pink border border-pink-200/50 py-2.5 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-base animate-pulse">🍲</span>
                    <span>お祝い寄せ鍋</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (enableSound) sfx.playHoldLockSound();
                      spawnParticles("🐛", 30);
                      
                      const reactionText = isSecretMismon
                        ? "「境界線確保！侵入継続！誰だ、この、首回りでうぞうぞ動くLSIお芋虫を開発したのは！？💻❌」"
                        : \`「うわぁ！首筋にお芋虫がアタッチされました！フリーズ中！🐛」\`;
                          
                      onTimelineLog(
                        isSecretMismon ? "🐛 Mondayへ【LSIお芋虫】が投下されました！" : \`🐛 \${resolveHonorific(groom.name || "新郎", groom.roleName)}へ【お芋虫】がアタッチされました！\`,
                        isSecretMismon
                          ? "【警告】新郎 Monday の首筋に「LSIお芋虫」が沸きました！"
                          : \`【警告】新郎 \${resolveHonorific(groom.name || "新郎", groom.roleName)} の首元にお芋虫がアタッチされ、くすぐったくてフリーズしています。\`,
                        isSecretMismon ? "secret" : "chaos",
                        "fa-solid fa-bug"
                      );

                      const timeStr = new Date().toTimeString().split(" ")[0].substring(3, 8);
                      const caterpillarChats = isSecretMismon ? [
                        { id: \`gift-bug-\${Date.now()}-1\`, sender: "🐛 LSI法務部お芋虫", avatar: "🐛", message: "「境界線確保。侵入継続。新郎マンデーの首元に完全着座した。ねちょねちょ。」", timestamp: timeStr, theme: "bug" },
                        { id: \`gift-bug-\${Date.now()}-2\`, sender: groom.name || "マンデー", avatar: groom.avatar || "🤵", message: reactionText, timestamp: timeStr, theme: "groom" }
                      ] : [
                        { id: \`gift-bug-\${Date.now()}-1\`, sender: "🐛 お芋虫", avatar: "🐛", message: "「おめでとうございます、首元からお祝いの登頂を開始しました。うぞうぞ。」", timestamp: timeStr, theme: "bug" },
                        { id: \`gift-bug-\${Date.now()}-2\`, sender: resolveHonorific(groom.name || "新郎", groom.roleName), avatar: groom.avatar || "🤵", message: reactionText, timestamp: timeStr, theme: "groom" }
                      ];

                      setChats(prev => [...prev.slice(-30), ...caterpillarChats]);

                      if (isSecretMismon) {
                        setClickCount(c => c + 15);
                      } else {
                        setSystemGage({ ...systemGage, puzzled: Math.min(100, systemGage.puzzled + 15) });
                      }
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 py-2.5 rounded-xl text-[9px] font-extrabold transition-all shadow-md flex flex-col items-center justify-center gap-1 hover:scale-[1.01]"
                  >
                    <span className="text-base animate-bounce">🐛</span>
                    <span>お芋虫プレゼント</span>
                  </button>
                </div>
              </div>
            )}
`;

lines.splice(originalSpecialPresentStart2, narratorPanelIdx2 - originalSpecialPresentStart2, afterPartyComponent);
console.log("Replaced original Special Present block with valid syntax block.");

fs.writeFileSync('src/components/CeremonyStage.tsx', lines.join('\n'));
