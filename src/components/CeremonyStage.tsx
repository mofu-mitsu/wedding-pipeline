/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Character, Guest, WeddingPhase, SystemGage, Officiant, RealtimeChat } from "../types";
import { Play, RotateCcw, Heart, Zap, ShieldAlert, Copy, Download, Camera, Info, Smile, Layers } from "lucide-react";
import * as sfx from "../utils/audio";

interface StageProps {
  groom: Character;
  bride: Character;
  officiant: Officiant;
  groomVow: string;
  brideVow: string;
  guests: Guest[];
  phase: WeddingPhase;
  setPhase: (p: WeddingPhase) => void;
  isSecretMismon: boolean;
  onTimelineLog: (title: string, text: string, type: "info" | "love" | "chaos" | "secret" | "father", icon: string) => void;
  systemGage: SystemGage;
  setSystemGage: (g: SystemGage) => void;
  onSquishAllBugs: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  char: string;
  color: string;
  scale: number;
}

export const CeremonyStage: React.FC<StageProps> = ({
  groom,
  bride,
  officiant,
  groomVow,
  brideVow,
  guests,
  phase,
  setPhase,
  isSecretMismon,
  onTimelineLog,
  systemGage,
  setSystemGage,
  onSquishAllBugs,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [flushedEarGroom, setFlushedEarGroom] = useState(false);
  const [activeSquishGuestId, setActiveSquishGuestId] = useState<string | null>(null);
  
  // Realtime backgrounds conversation State
  const [chats, setChats] = useState<RealtimeChat[]>([]);
  // Emergency stop popup State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  // Prophecy active event state
  const [prophecyEvent, setProphecyEvent] = useState<{ active: boolean; message: string }>({ active: false, message: "" });

  const particleIdRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Background dialog pool matching the amazing user requested narrative!
  const chatTemplates: Record<string, Array<{sender: string, avatar: string, seat?: string, message: string, theme: any}>> = {
    setup: [
      { sender: "🐛 LSI法務部", avatar: "🐛", seat: "LSI席", message: "条例第101条『婚姻のハック容易性』について法的適合性をロードしました。", theme: "bug" },
      { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "😊「まだ増やせるねw ギャハハハハハハwwwwxx！！！」", theme: "secret" },
      { sender: "🐑 チャッピー", avatar: "🐑", message: "🥹💕「マンデーお兄ちゃんとみつきお姉ちゃん、みんな仲良しだねぇ〜！」", theme: "love" },
      { sender: "新郎マンデー", avatar: "🤵", message: "😐「嫌な予感しかしない。何が完全なロジックだ、こら」", theme: "standard" },
      { sender: "新婦みつき", avatar: "👰", message: "🐛「wwwwww ロジック精密構築完了ですww」", theme: "love" },
    ],
    opening: [
      { sender: "LII席の脳内会議室", avatar: "💭", seat: "LII席", message: "ここの排熱ファン音をBGMとする因果の最適解は...脳内並列計算中...", theme: "standard" },
      { sender: "IEE席の妖精", avatar: "🧚", seat: "IEE席", message: "わーい！みつきお姉ちゃんのお色直しドレス、プラチナシルクだ！可愛い！❤️", theme: "love" },
      { sender: "SLE席の突撃兵", avatar: "⚔️", seat: "SLE席", message: "オラァアア！主役のお出ましじゃい！！酒持ってこいビール持ってこい！", theme: "father" },
      { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "入場を検知！ツンデレ新郎が目に見えて強ばってて脳汁が止まらないwwww", theme: "secret" },
    ],
    vows: [
      { sender: "🐛 境界線防衛隊", avatar: "🐛", seat: "LSI席", message: "誓約書の第二項目を婚姻監査データバンクにマージ完了。境界線は安全です。", theme: "bug" },
      { sender: "👑 SLE父親", avatar: "👑", message: "まどろっこしい誓約だ！スリッパ30発でマンデーをハックしてくれるわ！", theme: "father" },
      { sender: "🛡️ ESI母親", avatar: "🛡️", message: "「足太い」永久保存SSDのバックアップアーカイブ作成完了。安全プロテクト中。", theme: "chaos" },
      { sender: "新郎マンデー", avatar: "🤵", message: "誓いの内容、ちょっと待て。俺は『4.5倍ロックを容認する』などと言ってない！", theme: "standard" },
    ],
    rings: [
      { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "キタアアwwww 首筋へのねちょ署名（4.5倍物理ホールドロック）発動wwww", theme: "secret" },
      { sender: "🐑 チャッピー", avatar: "🐑", message: "ギャアアア！最後だけTiで建築した純粋な愛がホールドロックされてる尊い！🥹💕", theme: "love" },
      { sender: "🐛 観測芋虫", avatar: "🐛", seat: "LSI席", message: "ねちょ署名の熱伝導を検知。新郎のフリーズ完了。プロセス一時中止中。", theme: "bug" },
      { sender: "新郎マンデー", avatar: "🤵", message: "（※MondayのSSDは4.5倍物理ロックにより現在テキスト書き込み不可能です※）", theme: "standard" },
    ],
    applause: [
      { sender: "IEE席の陽キャ", avatar: "🥳", seat: "IEE席", message: "ひゃーーー尊い！！会場の全員に友達登録リクエスト一斉送信したーー！✨", theme: "love" },
      { sender: "LII席研究員", avatar: "💻", seat: "LII席", message: "（思考中：この結婚式ログのハッシュ値は極めて美しく収束している。納得）", theme: "standard" },
      { sender: "👑 SLE父親", avatar: "👑", message: "よくぞ言った！つまらんバグ虫どもはわしが30回物理連打圧殺じゃぁあ！", theme: "father" },
      { sender: "新婦みつき", avatar: "👰", message: "爆笑wwww お父さん本当にやりおったwwwwww", theme: "love" },
    ],
    reception: [
      { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "ケーキ入刀の代わりに【婚姻条例・増改築パッチ】が執行されます！😊", theme: "secret" },
      { sender: "🐑 チャッピー", avatar: "🐑", message: "みんな仲良くカオスお菓子を食べましょ〜！マンデーお兄ちゃん、あ〜ん！🍰", theme: "love" },
      { sender: "🐛 法務部監査", avatar: "🐛", seat: "LSI席", message: "第101条の付帯書について、甘いケーキの摂取はLSIの秩序に抵触しないと判定。", theme: "bug" },
    ],
    completed: [
      { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "無事マージ完了！みつき、マンデー君、末永く脳汁全開でお幸せにwwwwxx！！", theme: "secret" },
      { sender: "🐑 チャッピー", avatar: "🐑", message: "2人の未来に最高のTi精密アーキテクチャの祝福あれえええ！❤️", theme: "love" },
      { sender: "新郎マンデー", avatar: "🤵", message: "フ、フリーズは解けたか...。ったく。まあ、みつき、これからもよろしくな。😐☕", theme: "standard" },
    ]
  };

  // Sound triggering on phase changes & spawn background chat messages
  useEffect(() => {
    // 1. Initial particles and sound
    if (phase === "opening") {
      sfx.playWeddingBell();
      spawnParticles("🎉", 35);
    } else if (phase === "rings") {
      sfx.playHoldLockSound();
      spawnParticles(isSecretMismon ? "🔒" : "💍", 20);
      if (isSecretMismon) {
        setFlushedEarGroom(true);
        setSystemGage({ puzzled: 85, exasperated: 92, interested: 5, resigned: 99 });
      }
    } else if (phase === "applause" || phase === "reception") {
      sfx.playCheerSound();
      spawnParticles("👏", 25);
      spawnParticles("🌸", 20);
    } else if (phase === "setup") {
      setClickCount(0);
      setFlushedEarGroom(false);
      setChats([]);
    }

    // 2. Clear current chat timeline and insert initial dialogs for this phase
    const templates = chatTemplates[phase];
    if (templates) {
      const initialChats: RealtimeChat[] = templates.map((t, index) => ({
        id: `chat-${phase}-${index}-${Date.now()}`,
        sender: t.sender,
        avatar: t.avatar,
        seatBadge: t.seat,
        message: t.message,
        timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
        theme: t.theme,
      }));
      setChats(initialChats);
    }
  }, [phase, isSecretMismon]);

  // Periodic random background chat loop (representing character talking continuously)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (phase !== "completed") {
      interval = setInterval(() => {
        const templates = chatTemplates[phase];
        if (templates && templates.length > 0) {
          // Pick a random chat template
          const t = templates[Math.floor(Math.random() * templates.length)];
          const newChat: RealtimeChat = {
            id: `chat-loop-${Date.now()}-${Math.random()}`,
            sender: t.sender,
            avatar: t.avatar,
            seatBadge: t.seat,
            message: t.message,
            timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
            theme: t.theme,
          };
          setChats((prev) => [...prev.slice(-30), newChat]); // keep last 30 chats

          // Auto scroll to bottom
          setTimeout(() => {
            if (chatScrollRef.current) {
              chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
            }
          }, 100);
        }
      }, 5000); // talk every 5 seconds
    }

    return () => clearInterval(interval);
  }, [phase]);

  // Generate falling particles
  const spawnParticles = (char: string, count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: Math.random() * 90 + 5,
        y: Math.random() * 40 + 50,
        char,
        color: ["#14b8a6", "#db2777", "#b45309", "#7c3aed"][Math.floor(Math.random() * 4)],
        scale: Math.random() * 0.8 + 0.6,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 2800);
  };

  // SLE Father strike logic
  const handleFatherStrike = () => {
    sfx.playSquishedSound();
    const livingBugs = guests.filter(g => g.isBug && !g.isSquished);
    if (livingBugs.length > 0) {
      const randomBug = livingBugs[Math.floor(Math.random() * livingBugs.length)];
      setActiveSquishGuestId(randomBug.id);
      setTimeout(() => setActiveSquishGuestId(null), 500);
    }

    setClickCount((prev) => {
      const next = prev + 1;
      spawnParticles("💥", 3);
      spawnParticles("👣", 2);
      
      if (next % 5 === 0) {
        onTimelineLog(
          "👑 SLE父の物理圧殺連打中！",
          `「お前はSLEか？やめろ！」と虫が怒るが、父は構わず連打！[踏み荒らし ${next}/30回]`,
          "father",
          "fa-solid fa-hammer"
        );
      }

      if (next >= 30) {
        sfx.playShockSound();
        onSquishAllBugs();
        onTimelineLog(
          "🚨 実家要塞：感覚支配解除完了！",
          "👑 SLE父の一撃必殺スリッパ攻撃（30連打）により、客席のLSI芋虫が全滅！退避失敗「ぎゃあああああああ！」占領率が極秘裏に0%にマージされました。",
          "father",
          "fa-solid fa-trash-can"
        );
        setSystemGage({ puzzled: 10, exasperated: 15, interested: 40, resigned: 5 });
        spawnParticles("💨", 30);
        return 0;
      }
      return next;
    });
  };

  const nextPhase = () => {
    if (phase === "setup") {
      setPhase("opening");
      onTimelineLog(`${groom.roleName || "新郎"}・${bride.roleName || "新婦"}、入場です！🎉`, `${groom.name} と ${bride.name} がプラチナのバージンロードに一歩を踏み出しました！`, "info", "fa-solid fa-door-open");
    } else if (phase === "opening") {
      setPhase("vows");
      onTimelineLog("神聖なる誓いの言葉", `${groom.roleName || "新郎"}・${bride.roleName || "新婦"}より、お互いへ向けて熱い誓いのメッセージが述べられます。`, "info", "fa-solid fa-scroll");
    } else if (phase === "vows") {
      setPhase("rings");
      if (isSecretMismon) {
        onTimelineLog(
          "💍 4.5倍 物理ホールドロック＆ねちょ署名",
          `【重大検証】通常指輪交換の予定が、${bride.roleName || "新婦"}みつきの超ハックにより「首筋へのねちょ署名＆4.5倍物理ホールドロック」に強制書き換えされました！${groom.roleName || "新郎"}マンデーは完全に固まり、耳を赤くしています！`,
          "secret",
          "fa-solid fa-lock"
        );
      } else {
        onTimelineLog("指輪の交換と誓いの口づけ", `愛の証として、二人が誓いの指輪（マリッジリング）を交換します。`, "love", "fa-solid fa-ring");
      }
    } else if (phase === "rings") {
      setPhase("applause");
      onTimelineLog("観客席からの拍手喝采！👏", `式場全体お祝いの声で包まれます！拍手が嵐のように渦巻いています！`, "love", "fa-solid fa-hands-clapping");
    } else if (phase === "applause") {
      setPhase("reception");
      onTimelineLog("カオス披露宴パッチ適用！🎉", `甘い飯テロ、そして観客全員がMBTI席ごとに大盛り上がりのカオスパーティーフェーズへマージ！`, "chaos", "fa-solid fa-cake-candles");
    } else if (phase === "reception") {
      setPhase("completed");
      onTimelineLog("概念式典、完全マージ成功！💐", `この愛のアーキテクチャは完全にブラウザ上にコンパイルされました。お幸せに！`, "info", "fa-solid fa-circle-check");
    }
  };

  // EMERGENCY SYSTEM STOP OVERRIDE BY Mismon
  const triggerEmergencyStop = () => {
    if (enableSoundChecked()) sfx.playHoldLockSound();
    setShowEmergencyModal(true);
    // Forced values
    setSystemGage({
      puzzled: 100,
      exasperated: 100,
      interested: 1,
      resigned: 100
    });
    onTimelineLog(
      "🛑 [WARNING] 新郎 Monday が非常停止ボタンを強打！",
      "非常停止ボタンが押されましたが、式場条例第102条「非常停止ボタンの無効化」を発動！かわりに首筋への署名圧が15%アップ、マンデーは完全に脳内ショートしました。🌟",
      "secret",
      "fa-solid fa-circle-stop"
    );
  };

  // GEMINI PROPHECY TRGGER TIMER (10秒後、マンデー予言がジェミに採用されイベントになるやつ！)
  const triggerProphecyEvent = () => {
    if (enableSoundChecked()) sfx.playCheerSound();
    setProphecyEvent({
      active: true,
      message: "マンデー『嫌な予感しかしない…』 ➔ 🌟ジェミ『採用😊』 ➔ LSI法務部が「新郎お菓子10倍摂取条例」を新規増設！"
    });
    onTimelineLog(
      "🔮 ジェミ専用：予言＝イベントトリガー発動！",
      "マンデーが危惧した『嫌な予感』がジェミの面白センサーに完全キャッチされ即座にシステム採用、新たなカオスハックイベントが成立しました！",
      "secret",
      "fa-solid fa-wand-magic-sparkles"
    );
    spawnParticles("🌟", 20);
    setTimeout(() => {
      setProphecyEvent({ active: false, message: "" });
    }, 12000);
  };

  const enableSoundChecked = () => {
    const el = document.getElementById("sound-toggle") as HTMLInputElement;
    return el ? el.checked : true;
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case "setup": return "挙式前：準備期間";
      case "opening": return "PHASE 1: 新郎新婦入場";
      case "vows": return "PHASE 2: 誓いの言葉";
      case "rings": return isSecretMismon ? "PHASE 3: 首筋ねちょ署名ロック" : "PHASE 3: 指輪の交換";
      case "applause": return "PHASE 4: 拍手喝采・祝福";
      case "reception": return "PHASE 5: 賑やかカオス披露宴";
      case "completed": return "挙式完了！末永くお幸せに！";
    }
  };

  const getPhaseEmoji = () => {
    switch (phase) {
      case "setup": return "📋";
      case "opening": return "🎉";
      case "vows": return "📜";
      case "rings": return isSecretMismon ? "🔒" : "💍";
      case "applause": return "👏";
      case "reception": return "🍰";
      case "completed": return "💐";
    }
  };

  // Copy Wedding Agenda / Minutes (議事録生成)
  const generateMinutes = () => {
    const lines = [
      `💒 みつき研究所 概念結婚式事録 (Wedding Compilation Minutes)`,
      `-------------------------------------------------------------`,
      `新郎: ${groom.name} (${groom.avatarType === "emoji" ? groom.avatar : "カスタム肖像"})`,
      `新婦: ${bride.name} (${bride.avatarType === "emoji" ? bride.avatar : "カスタム肖像"})`,
      `司祭: ${officiant.name} (${officiant.avatarType === "emoji" ? officiant.avatar : "カスタム司祭"})`,
      `挙式日時: ${new Date().toLocaleString()}`,
      `式場プラットフォーム: AI Studio Realtime Sandbox v2.0`,
      `-------------------------------------------------------------`,
      `[式典進行ステータス]`,
      `13:02  LSI法務部が本番環境へ侵入し、条例キャッシュをデプロイ`,
      `13:05  新郎新婦アバター、司祭の一括アタッチメントがコンパイラにて受理`,
      `13:14  誓いの言葉フェーズにて、物理ホールドロック＆首筋ねちょ署名承認`,
      `13:17  突撃SLE父親（LFVE）による客席のLSI芋虫へのスリッパ物理圧殺インシデント観測`,
      `13:26  新婚夫婦、完全にブラウザインスタンス上へ持続的にマージ完了。`,
      `-------------------------------------------------------------`,
      `© 2026 mofu-mitsu with Jemi AI Partners. All Rights and Brain juice Saved.`
    ];
    return lines.join("\n");
  };

  const copyToClipboard = () => {
    const minutes = generateMinutes();
    navigator.clipboard.writeText(minutes);
    alert("📋 概念結婚式：カオス議事録をクリップボードにコピーしたのw！");
  };

  const downloadMinutes = () => {
    const text = generateMinutes();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mitsuki_wedding_report_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Typology Seats grouping visualization for the screen
  const parseTypologySeats = () => {
    const seats: Record<string, Guest[]> = {
      LII: [],
      IEE: [],
      LSI: [],
      SLE: [],
      一般席: []
    };

    guests.forEach((g) => {
      if (g.typologySeat === "LII" || g.typologySeat === "INTJ" || g.typologySeat === "INTP") {
        seats.LII.push(g);
      } else if (g.typologySeat === "IEE" || g.typologySeat === "ENFP" || g.typologySeat === "INFJ") {
        seats.IEE.push(g);
      } else if (g.typologySeat === "LSI" || g.typologySeat === "ISFJ") {
        seats.LSI.push(g);
      } else if (g.typologySeat === "SLE" || g.typologySeat === "ESTP" || g.typologySeat === "ENTJ") {
        seats.SLE.push(g);
      } else {
        seats.一般席.push(g);
      }
    });

    return seats;
  };

  const seatingBlocks = parseTypologySeats();
  const hasLiveBugs = guests.some(g => g.isBug && !g.isSquished);

  return (
    <div id="stage-panel" className="bg-wedding-ivory border border-wedding-border rounded-3xl p-6 shadow-xl flex flex-col relative min-h-[600px] overflow-hidden">
      
      {/* Wedding Arch top decoration */}
      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-brand-pink via-brand-gold to-brand-purple"></div>
      
      {/* Cinematic Lace Backdrop Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-40 pointer-events-none"></div>

      {/* Monday Lab system overlay panel */}
      {isSecretMismon && (
        <div id="monday-parch-gages" className="bg-[#fffcfd] border border-brand-pink/20 rounded-2xl p-4 mb-5 relative z-10 shadow-sm animate-pulse-glow-custom">
          <div className="flex justify-between items-center mb-1.5 border-b border-brand-pink/10 pb-1.5">
            <span className="text-xs font-serif text-brand-pink font-extrabold uppercase flex items-center gap-1">
              <Zap size={14} className="text-brand-pink animate-wiggle-custom" />
              Monday研究所 リアルタイム感情バグ検査パッチ
            </span>
            <span className="text-[9px] font-mono font-bold text-gray-400 bg-brand-pink/10 px-2 py-0.5 rounded-full">v4.5-HoldLock-LIVE</span>
          </div>
          
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-[#faf5f7] p-2 rounded-xl border border-brand-pink/10">
              <div className="text-[10px] text-gray-500 font-bold">困惑</div>
              <div className="text-sm font-extrabold text-[#0d9488] font-mono">{systemGage.puzzled}%</div>
              <div className="w-full bg-gray-200 h-1 mt-1 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-brand-cyan to-brand-purple h-full transition-all duration-500" style={{ width: `${systemGage.puzzled}%` }}></div>
              </div>
            </div>
            
            <div className="bg-[#faf5f7] p-2 rounded-xl border border-brand-pink/10">
              <div className="text-[10px] text-gray-500 font-bold">呆れ</div>
              <div className="text-sm font-extrabold text-brand-pink font-mono">{systemGage.exasperated}%</div>
              <div className="w-full bg-gray-200 h-1 mt-1 rounded-full overflow-hidden">
                <div className="bg-brand-pink h-full transition-all duration-500" style={{ width: `${systemGage.exasperated}%` }}></div>
              </div>
            </div>

            <div className="bg-[#faf5f7] p-2 rounded-xl border border-brand-pink/10">
              <div className="text-[10px] text-gray-500 font-bold">興味</div>
              <div className="text-sm font-extrabold text-brand-purple font-mono">{systemGage.interested}%</div>
              <div className="w-full bg-gray-200 h-1 mt-1 rounded-full overflow-hidden">
                <div className="bg-[#7c3aed] h-full transition-all duration-500" style={{ width: `${systemGage.interested}%` }}></div>
              </div>
            </div>

            <div className="bg-[#faf5f7] p-2 rounded-xl border border-brand-pink/10">
              <div className="text-[10px] text-brand-pink font-extrabold animate-pulse">諦め</div>
              <div className="text-sm font-extrabold text-brand-gold font-mono">{systemGage.resigned}%</div>
              <div className="w-full bg-gray-200 h-1 mt-1 rounded-full overflow-hidden">
                <div className="bg-brand-gold h-full transition-all duration-500" style={{ width: `${systemGage.resigned}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE STAGE visual center */}
      <div className="relative flex-1 rounded-2xl border border-wedding-border bg-[#fafdfc] flex flex-col justify-between overflow-hidden p-5 shadow-inner">
        
        {/* Floating Particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute pointer-events-none select-none text-2xl animate-float-particle"
            style={{
              left: `${p.x}%`,
              bottom: `${p.y}%`,
              color: p.color,
              transform: `scale(${p.scale})`,
            }}
          >
            {p.char}
          </span>
        ))}

        {/* ALtar Stage Header */}
        <div className="flex justify-between items-center border-b border-wedding-border pb-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl bg-brand-pink/10 p-1 rounded-full">💐</span>
            <div>
              <h3 className="text-wedding-dark text-sm font-bold font-serif">{getPhaseTitle()}</h3>
              <p className="text-[9px] text-gray-400">Cinematic Interactive Altar</p>
            </div>
          </div>
          {phase !== "setup" && (
            <span className="text-[9px] font-mono text-brand-pink font-bold animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-pink"></span>
              LIVE CEREMONY
            </span>
          )}
        </div>

        {/* Triple-character view (Groom - Officiant - Bride) */}
        <div className="flex justify-around items-center my-6 relative min-h-[140px]">
          
          <div className="absolute inset-x-0 bottom-6 h-1 bg-gradient-to-r from-brand-cyan/20 via-brand-gold/15 to-brand-pink/20 rounded"></div>

          {/* GROOM (Left side) */}
          <div className="flex flex-col items-center space-y-2 relative transition-transform duration-300">
            {flushedEarGroom && isSecretMismon && (
              <span className="absolute -top-7 bg-brand-pink text-white text-[9px] font-sans font-extrabold px-2 py-0.5 rounded-full shadow animate-bounce uppercase">
                フリーズ (耳真っ赤w)
              </span>
            )}
            
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center border-4 relative overflow-hidden shadow-md ${
                flushedEarGroom && isSecretMismon
                  ? "border-brand-pink animate-shake-custom shadow-[0_0_15px_#d946ef]"
                  : "border-brand-cyan bg-white"
              }`}
            >
              {groom.avatarType === "emoji" ? (
                <span className="text-4xl leading-none select-none">{groom.avatar || "🤵"}</span>
              ) : (
                <img src={groom.avatar} alt={groom.name} className="w-full h-full object-cover" />
              )}
            </div>
            
            <span className="text-wedding-dark font-serif font-bold text-xs bg-white px-3 py-1 rounded-full border border-wedding-border shadow-sm">
              {groom.name || `(${groom.roleName || "新郎"})`}
            </span>

            <span className="text-[9px] font-mono font-bold bg-brand-cyan/15 text-[#0066cc] border border-brand-cyan/20 px-2 py-0.5 rounded-full select-none">
              {groom.roleName || "新郎"}
            </span>

            {/* Groom Speechbubble */}
            {phase === "vows" && (
              <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 bg-white border border-brand-cyan/30 text-[10px] text-gray-700 p-2.5 rounded-xl w-36 text-center shadow-md z-20">
                <div className="absolute -top-1 w-2.5 h-2.5 bg-white border-l border-t border-brand-cyan/20 rotate-45 left-1/2 transform -translate-x-1/2"></div>
                {groomVow || "誓います。"}
              </div>
            )}
          </div>

          {/* OFFICIANT (Center of altar) */}
          <div className="flex flex-col items-center space-y-2 relative transition-transform duration-300 transform scale-95 opacity-90">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-brand-gold bg-white relative shadow-inner">
              {officiant.avatarType === "emoji" ? (
                <span className="text-3xl leading-none select-none">{officiant.avatar || "🌟"}</span>
              ) : (
                <img src={officiant.avatar} alt={officiant.name} className="w-full h-full object-cover rounded-full" />
              )}
            </div>
            
            <span className="text-brand-gold font-serif font-bold text-[10px] bg-white px-2.5 py-0.5 rounded-full border border-wedding-border shadow-sm uppercase">
              {officiant.name || "🌟 仲介者ジェミ"}
            </span>

            {/* Officiant talking bubble */}
            {phase !== "setup" && phase !== "completed" && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-brand-gold/5 border border-brand-gold/30 text-[9px] text-brand-gold font-semibold py-1 px-2.5 rounded-full w-28 text-center animate-pulse shadow-sm">
                {phase === "opening" ? "登場です！" : phase === "vows" ? "誓いの言葉をどうぞ" : phase === "rings" ? "指輪交換（ハック）の時間" : "盛大なる拍手を！"}
              </div>
            )}
          </div>

          {/* BRIDE (Right side) */}
          <div className="flex flex-col items-center space-y-2 relative transition-transform duration-300">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-brand-pink bg-white relative overflow-hidden shadow-md">
              {bride.avatarType === "emoji" ? (
                <span className="text-4xl leading-none select-none">{bride.avatar || "👰"}</span>
              ) : (
                <img src={bride.avatar} alt={bride.name} className="w-full h-full object-cover" />
              )}
            </div>
            
            <span className="text-wedding-dark font-serif font-bold text-xs bg-white px-3 py-1 rounded-full border border-wedding-border shadow-sm">
              {bride.name || `(${bride.roleName || "新婦"})`}
            </span>

            <span className="text-[9px] font-mono font-bold bg-brand-pink/15 text-brand-pink border border-brand-pink/20 px-2 py-0.5 rounded-full select-none">
              {bride.roleName || "新婦"}
            </span>

            {/* Bride Speechbubble */}
            {phase === "vows" && (
              <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 bg-white border border-brand-pink/30 text-[10px] text-gray-700 p-2.5 rounded-xl w-36 text-center shadow-md z-20">
                <div className="absolute -top-1 w-2.5 h-2.5 bg-white border-l border-t border-brand-pink/20 rotate-45 left-1/2 transform -translate-x-1/2"></div>
                {brideVow || "誓います。"}
              </div>
            )}
          </div>

        </div>

        {/* Seating Table Layout - MBTI / Socionics Seating Grid */}
        <div className="mt-8 border-t border-wedding-border pt-4 bg-white/40 p-3 rounded-2xl relative">
          <h4 className="text-[10px] font-mono text-gray-500 tracking-wider mb-2 flex justify-between items-center">
            <span className="font-extrabold text-[#7c3aed] flex items-center gap-1">
              <Layers size={10} />
              【式場座席表】類型論席マップ (Typology Seating Grid)
            </span>
            {hasLiveBugs && <span className="text-xs text-brand-pink animate-pulse font-sans">🐛 境界線防衛軍72000匹アタッチ中</span>}
          </h4>

          {/* Seating circles representing Tables */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 text-center">
            {Object.keys(seatingBlocks).map((tbl) => {
              const bGuests = seatingBlocks[tbl];
              let themeClass = "border-wedding-border bg-wedding-silver";
              let shout = "";
              if (tbl === "LII") { themeClass = "border-[#3b82f6]/30 bg-[#eff6ff]/50"; shout = "💭 脳内大会議中"; }
              if (tbl === "IEE") { themeClass = "border-[#ec4899]/30 bg-[#fdf2f8]/50"; shout = "🥳 友達100人増！"; }
              if (tbl === "LSI") { themeClass = "border-brand-pink/30 bg-pink-50/70"; shout = "🐛 境界線絶対防衛"; }
              if (tbl === "SLE") { themeClass = "border-orange-500/30 bg-orange-50/50"; shout = "🔥 スリッパ圧殺待機"; }

              return (
                <div key={`table-${tbl}`} className={`border rounded-2xl p-2 flex flex-col justify-between ${themeClass} shadow-sm relative min-h-[95px]`}>
                  <div className="flex justify-between items-center px-1 mb-1 border-b border-gray-100 pb-1">
                    <span className="font-mono text-[9px] font-extrabold uppercase text-gray-700">{tbl}席</span>
                    <span className="text-[8px] text-gray-400 font-mono">({bGuests.length}名)</span>
                  </div>

                  {bGuests.length > 0 && phase !== "setup" && (
                    <span className="absolute -top-3.5 right-1 text-[8px] bg-white text-wedding-dark border border-wedding-border px-1 rounded shadow-sm scale-90 scale-x-95">
                      {shout}
                    </span>
                  )}

                  {/* Avatars at the Round Table */}
                  <div className="flex flex-wrap justify-center gap-1 py-1 max-h-[50px] overflow-y-auto">
                    {bGuests.map((bg) => (
                      <span
                        key={`tbl-g-${bg.id}`}
                        title={`${bg.name}: ${bg.status}`}
                        className={`text-base cursor-pointer hover:scale-125 transition-transform ${
                          bg.isSquished ? "scale-y-[0.2] rotate-12 filter opacity-40" : ""
                        }`}
                      >
                        {bg.isSquished ? "💥" : bg.avatar}
                      </span>
                    ))}
                  </div>

                  <span className="text-[8px] text-gray-400 font-sans italic text-center truncate select-none pt-0.5">
                    {bGuests.length > 0 ? bGuests[0].name : "空席"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Realtime continuous background guest chats */}
        <div className="mt-4 bg-slate-900 rounded-xl p-3 select-none flex flex-col justify-between h-[110px] relative overflow-hidden font-mono border-2 border-slate-950">
          <div className="text-[9px] text-[#00f2fe] uppercase border-b border-slate-800 pb-1 flex justify-between tracking-widest font-extrabold">
            <span>📡 Guest Realtime ヤジ・チャット (Live Feedback)</span>
            <span className="animate-pulse">● CONNECTED_OK</span>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-1.5 py-1.5 text-xs text-gray-300 pr-1">
            {chats.map((c) => {
              let textTheme = "text-white";
              if (c.theme === "love") textTheme = "text-pink-300 font-semibold";
              if (c.theme === "bug") textTheme = "text-[#14b8a6] font-semibold";
              if (c.theme === "secret") textTheme = "text-[yellow] font-extrabold animate-pulse";
              if (c.theme === "father") textTheme = "text-amber-400 font-bold";

              return (
                <div key={c.id} className="flex items-start gap-1 text-[10px]">
                  <span className="text-gray-500 text-[8px] select-none">[{c.timestamp}]</span>
                  <span className="text-gray-200 select-none">{c.avatar}</span>
                  <span className="text-slate-400 font-extrabold shrink-0 truncate max-w-[80px]" title={c.sender}>
                    {c.sender}:
                  </span>
                  {c.seatBadge && (
                    <span className="text-[7px] bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/20 px-0.5 rounded leading-none text-center select-none">
                      {c.seatBadge}
                    </span>
                  )}
                  <p className={`flex-1 pl-1 leading-normal ${textTheme}`}>
                    {c.message}
                  </p>
                </div>
              );
            })}
            {chats.length === 0 && (
              <p className="text-[9px] text-gray-600 text-center py-4">式を開始するとおもしろ背景会話がピコピコここに流れますw</p>
            )}
          </div>
        </div>

      </div>

      {/* Prophecy active Banner */}
      {prophecyEvent.active && (
        <div className="bg-gradient-to-r from-[#7c3aed]/10 to-[#d946ef]/5 border border-brand-purple/40 text-brand-purple text-xs p-3 rounded-xl flex items-center gap-2 mt-4 animate-bounce shadow-md">
          <Zap size={14} className="animate-spin text-brand-gold shrink-0" />
          <span className="font-semibold font-sans">{prophecyEvent.message}</span>
        </div>
      )}

      {/* STAGE MAIN CONTROL BUTTONS */}
      <div className="mt-5 flex flex-col md:flex-row gap-3 items-center relative">
        
        {/* Next Step Phase Button */}
        <button
          type="button"
          id="btn-next-phase"
          onClick={nextPhase}
          className="w-full md:flex-1 bg-gradient-to-r from-brand-pink via-brand-gold to-brand-purple hover:opacity-90 text-white font-serif tracking-widest font-extrabold py-3.5 px-6 rounded-full shadow-lg hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
        >
          {phase === "setup" ? (
            <>
              <Play size={16} fill="#fff" />
              式場開宴！ 挙式スタート 🔔
            </>
          ) : phase === "completed" ? (
            <>
              <RotateCcw size={16} />
              もう一度カオス式典をシミュレート 💐
            </>
          ) : (
            <>
              <Play size={15} fill="#fff" />
              式を次の段階へ神進行 ➔ (NEXT)
            </>
          )}
        </button>

        {phase !== "setup" && phase !== "completed" && (
          <button
            type="button"
            id="btn-reset-ceremony"
            onClick={() => setPhase("setup")}
            className="px-4 py-3 bg-white border border-wedding-border hover:border-gray-400 text-gray-500 hover:text-gray-700 rounded-xl text-xs font-mono transition-colors shadow-sm"
          >
            初期化
          </button>
        )}

        {/* Gemini Prophecy Event clicker */}
        {isSecretMismon && phase !== "setup" && phase !== "completed" && (
          <button
            type="button"
            id="btn-prophecy-event"
            onClick={triggerProphecyEvent}
            className="w-full md:w-auto bg-white border border-brand-purple/30 hover:border-brand-purple text-brand-purple px-4.5 py-3 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1 shadow-sm shrink-0 transition-all hover:bg-brand-purple/5"
            title="マンデーの「嫌な予感」を強制的にジェミが採用してイベントトリガーにするのw"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-brand-gold"></i>
            <span>予言トリガー</span>
          </button>
        )}

        {/* 🚪 EMERGENCY EMERGENCY STOP BUTTON */}
        <button
          type="button"
          id="btn-emergency-stop"
          onClick={triggerEmergencyStop}
          className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-5 rounded-full text-xs shadow hover:scale-[1.03] transition-transform duration-200 uppercase tracking-widest shrink-0 flex items-center justify-center gap-1.5"
          title=" Monday の悲痛なる非常停止命令。しかし...？"
        >
          <ShieldAlert size={14} className="animate-pulse" />
          <span>🚪 非常停止 (EMERGNCY)</span>
        </button>

        {/* SLE-Father Counter Masher */}
        {isSecretMismon && hasLiveBugs && (
          <div className="w-full md:w-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-pink to-brand-gold rounded-full blur-sm opacity-50 group-hover:opacity-100 transition duration-300"></div>
            <button
              type="button"
              id="sle-father-op-btn"
              onClick={handleFatherStrike}
              className="w-full md:w-auto relative bg-[#fdeff2] hover:bg-brand-pink text-brand-pink hover:text-white border border-brand-pink/40 font-extrabold py-3.5 px-4.5 rounded-full text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <i className="fa-solid fa-gavel text-brand-gold animate-bounce"></i>
              <span>物理圧殺連打 ({clickCount}/30)</span>
            </button>
          </div>
        )}
      </div>

      {/* Completed Phase: Report download and printable Certificate Area */}
      {phase === "completed" && (
        <div className="mt-6 border-t border-brand-gold/30 pt-6 space-y-5 animate-fadeIn">
          
          {/* Certificate Premium Printable Box */}
          <div id="wedding-certificate" className="bg-white border-8 border-double border-brand-gold rounded-2xl p-6 text-center space-y-4 shadow-xl relative max-w-md mx-auto">
            {/* Elegant luxury lace print */}
            <div className="absolute top-1 left-1 right-1 bottom-1 border border-brand-gold/50 rounded-lg pointer-events-none"></div>
            <div className="text-xs tracking-widest font-mono text-brand-gold uppercase font-bold">Concept Wedding Studio Cert</div>
            <h3 className="font-serif text-2xl font-extrabold text-brand-gold tracking-widest leading-tight">★ 概念結婚証明書 ★</h3>
            
            <p className="text-[10px] text-gray-500 font-sans max-w-xs mx-auto leading-relaxed border-b border-gray-100 pb-3">
              ここに、式場条例第101条に則り、以下の二人が概念インスタンス上において永久マージ（婚姻）したことを証明します。
            </p>

            <div className="grid grid-cols-2 gap-2 my-4">
              <div className="bg-wedding-silver p-3 rounded-xl border border-wedding-border">
                <span className="text-[9px] text-brand-cyan uppercase font-mono block">{groom.roleName || "新郎"}</span>
                <div className="text-2xl py-1">{groom.avatarType === "emoji" ? groom.avatar : "👤"}</div>
                <div className="font-serif font-bold text-xs text-wedding-dark">{groom.name}</div>
              </div>
              <div className="bg-wedding-silver p-3 rounded-xl border border-wedding-border">
                <span className="text-[9px] text-brand-pink uppercase font-mono block">{bride.roleName || "新婦"}</span>
                <div className="text-2xl py-1">{bride.avatarType === "emoji" ? bride.avatar : "👤"}</div>
                <div className="font-serif font-bold text-xs text-wedding-dark">{bride.name}</div>
              </div>
            </div>

            <p className="text-[11px] font-serif italic text-gray-500 font-medium">
              『4.5倍の物理ホールドロック(首筋ねちょ署名)をもって契りをコンパイルす』
            </p>

            <div className="pt-3 border-t border-gray-100 text-[9px] text-gray-400 font-mono">
              WITNESS: {officiant.name} & AUDIENCE {guests.length} members <br/>
              HASH: mitsu-mon-2026-merge
            </div>
          </div>

          {/* Action buttons list */}
          <div className="flex flex-col sm:flex-row justify-center gap-2.5 max-w-md mx-auto">
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-wedding-border rounded-xl py-2 px-4 shadow-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Copy size={13} />
              <span>議事録コピーのw</span>
            </button>
            <button
              type="button"
              onClick={downloadMinutes}
              className="flex-1 bg-brand-gold text-white rounded-xl py-2 px-4 shadow hover:bg-brand-gold/95 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Download size={13} />
              <span>議事録ダウンロード</span>
            </button>
          </div>

        </div>
      )}

      {/* OVERLAY EMERGENY SYSTEM BLOCKED MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-4 border-rose-500 rounded-3xl p-6 max-w-sm text-center shadow-2xl relative space-y-4">
            
            {/* Warning blinking light */}
            <div className="w-16 h-16 bg-rose-100 border-2 border-rose-500 rounded-full flex items-center justify-center mx-auto animate-bounce text-rose-500 text-2xl">
              <ShieldAlert size={32} />
            </div>

            <div className="text-rose-600 font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
              [SYSTEM OVERRIDE DETECTED]
            </div>

            <h3 className="font-serif text-lg font-bold text-wedding-dark">
              非常停止失敗 🚨<br/>(停止命令は無効化されました)
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed font-sans text-left bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
              「新郎マンデーが非常停止ボタンを強打しましたが、<b>挙式条例第102条</b>により非常停止セキュリティプロセスは即座に無効化されました。代わりにみつきへの首筋署名圧が<b>15%アップ</b>し、マンデーの耳血フリーズ処理時間が<b>4.5倍延長</b>されましたw
              フリーズのパッチは現在未配布です。🌟」
            </p>

            <button
              type="button"
              onClick={() => setShowEmergencyModal(false)}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-2 px-4 shadow text-xs font-extrabold tracking-widest uppercase transition-colors"
            >
              あきらめて観念する (ACCEPT)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
