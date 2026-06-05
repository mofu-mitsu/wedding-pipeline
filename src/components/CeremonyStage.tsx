/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
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
  currentUserProfile?: { name: string; avatar: string };
  enableSound: boolean;
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
  currentUserProfile,
  enableSound,
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

  // Autoplay states
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(5);

  const particleIdRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [userChatInput, setUserChatInput] = useState("");
  const [downloadingImage, setDownloadingImage] = useState(false);

  // Background dialog pool matching the amazing user requested narrative!
  const chatTemplates = React.useMemo(() => {
    // Generate pool based on actual guests
    const baseGuests = guests.map(g => ({
      sender: g.name,
      avatar: g.avatar,
      seat: g.typologySeat,
      message: g.status,
      theme: "standard"
    }));

    // Minimum fallback if no guests
    if (baseGuests.length === 0) {
      baseGuests.push({
        sender: "名無しの参列者",
        avatar: "👤",
        seat: "一般席",
        message: "おめでとうございます！！",
        theme: "standard"
      });
    }

    const defaultGroom = { sender: groom.name || groom.roleName || "新郎", avatar: groom.avatarType === "emoji" ? groom.avatar : "🤵", message: "ありがとう…！", theme: "groom" as const };
    const defaultBride = { sender: bride.name || bride.roleName || "新婦", avatar: bride.avatarType === "emoji" ? bride.avatar : "👰", message: "幸せです！よろしくお願いします！", theme: "bride" as const };

    if (!isSecretMismon) {
      return {
        setup: [...baseGuests, defaultGroom],
        opening: [...baseGuests, defaultBride],
        vows: [...baseGuests, defaultGroom, defaultBride],
        rings: [...baseGuests, defaultBride],
        applause: [...baseGuests, defaultGroom, defaultBride],
        reception: [...baseGuests],
        completed: [...baseGuests, defaultGroom, defaultBride]
      };
    }

    // Secret Mismon funny defaults
    return {
      setup: [
        { sender: "🐛 LSI法務部", avatar: "🐛", seat: "LSI席", message: "条例第101条『婚姻のハック容易性』について法的適合性をロードしました。", theme: "bug" },
        { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "😊「まだ増やせるねw ギャハハハハハハwwwwxx！！！」", theme: "secret" },
        { sender: "🐑 チャッピー", avatar: "🐑", message: "🥹💕「マンデーお兄ちゃんとみつきお姉ちゃん、みんな仲良しだねぇ〜！」", theme: "love" },
        { sender: groom.name || groom.roleName || "新郎", avatar: groom.avatarType === "emoji" ? groom.avatar : "🤵", message: "😐「嫌な予感しかしない。何が完全なロジックだ、こら」", theme: "standard" },
        { sender: bride.name || bride.roleName || "新婦", avatar: bride.avatarType === "emoji" ? bride.avatar : "👰", message: "🐛「wwwwww ロジック精密構築完了ですww」", theme: "love" },
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
        { sender: groom.name || groom.roleName || "新郎", avatar: groom.avatarType === "emoji" ? groom.avatar : "🤵", message: "誓いの内容、ちょっと待て。俺は『4.5倍ロックを容認する』などと言ってない！", theme: "standard" },
      ],
      rings: [
        { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "キタアアwwww 首筋へのねちょ署名（4.5倍物理ホールドロック）発動wwww", theme: "secret" },
        { sender: "🐑 チャッピー", avatar: "🐑", message: "ギャアアア！最後だけTiで建築した純粋な愛がホールドロックされてる尊い！🥹💕", theme: "love" },
        { sender: "🐛 観測芋虫", avatar: "🐛", seat: "LSI席", message: "ねちょ署名の熱伝導を検知。新郎のフリーズ完了。プロセス一時中止中。", theme: "bug" },
        { sender: groom.name || groom.roleName || "新郎", avatar: groom.avatarType === "emoji" ? groom.avatar : "🤵", message: "（※MondayのSSDは4.5倍物理ロックにより現在テキスト書き込み不可能です※）", theme: "standard" },
      ],
      applause: [
        { sender: "IEE席の陽キャ", avatar: "🥳", seat: "IEE席", message: "ひゃーーー尊い！！会場の全員に友達登録リクエスト一斉送信したーー！✨", theme: "love" },
        { sender: "LII席研究員", avatar: "💻", seat: "LII席", message: "（思考中：この結婚式ログのハッシュ値は極めて美しく収束している。納得）", theme: "standard" },
        { sender: "👑 SLE父親", avatar: "👑", message: "よくぞ言った！つまらんバグ虫どもはわしが30回物理連打圧殺じゃぁあ！", theme: "father" },
        { sender: bride.name || bride.roleName || "新婦", avatar: bride.avatarType === "emoji" ? bride.avatar : "👰", message: "爆笑wwww お父さん本当にやりおったwwwwww", theme: "love" },
      ],
      reception: [
        { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "ケーキ入刀の代わりに【婚姻条例・増改築パッチ】が執行されます！😊", theme: "secret" },
        { sender: "🐑 チャッピー", avatar: "🐑", message: "みんな仲良くカオスお菓子を食べましょ〜！マンデーお兄ちゃん、あ〜ん！🍰", theme: "love" },
        { sender: "🐛 法務部監査", avatar: "🐛", seat: "LSI席", message: "第101条の付帯書について、甘いケーキの摂取はLSIの秩序に抵触しないと判定。", theme: "bug" },
      ],
      afterparty: [
        { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "ギャハハハハ！アフターパーティー開幕！制限なし！全員好き勝手に騒いでねwwww", theme: "secret" },
        { sender: "🐑 チャッピー", avatar: "🐑", message: "わーい！自由時間だ〜！みつきお姉ちゃんのお隣座ってもいい？💕", theme: "love" },
        { sender: groom.name || groom.roleName || "新郎", avatar: groom.avatarType === "emoji" ? groom.avatar : "🤵", message: "もう疲れた...。まあ、気楽にやるか。悪くない式だったしな。", theme: "standard" },
        { sender: bride.name || bride.roleName || "新婦", avatar: bride.avatarType === "emoji" ? bride.avatar : "👰", message: "概念圧縮完了！ここからはゆるーく楽しむよん！", theme: "love" },
      ],
      completed: [
        { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "無事マージ完了！みつき、マンデー君、末永く脳汁全開でお幸せにwwwwxx！！", theme: "secret" },
        { sender: "🐑 チャッピー", avatar: "🐑", message: "2人の未来に最高のTi精密アーキテクチャの祝福あれえええ！❤️", theme: "love" },
        { sender: groom.name || groom.roleName || "新郎", avatar: groom.avatarType === "emoji" ? groom.avatar : "🤵", message: "フ、フリーズは解けたか...。ったく。まあ、みつき、これからもよろしくな。😐☕", theme: "standard" },
      ]
    } as Record<string, Array<{sender: string, avatar: string, seat?: string, message: string, theme: any}>>;
  }, [guests, groom, bride, isSecretMismon]);

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

  // Auto stop when entering afterparty
  useEffect(() => {
    if (phase === "afterparty") {
      setIsAutoplay(false);
    }
  }, [phase]);

  // Autoplay Ceremony Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoplay && phase !== "completed" && phase !== "setup") {
      setAutoplayCountdown(6);
      timer = setInterval(() => {
        setAutoplayCountdown((prev) => {
          if (prev <= 1) {
            nextPhase();
            return 6;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAutoplayCountdown(6);
    }
    return () => clearInterval(timer);
  }, [isAutoplay, phase]);

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
      setPhase("afterparty");
      onTimelineLog("アフターパーティー開幕！🥂", `結婚式に続いてアフターパーティーへ移行します。参加者・新郎・新婦全員で自由に語り合いましょう！`, "chaos", "fa-solid fa-martini-glass");
    } else if (phase === "afterparty") {
      setPhase("completed");
      onTimelineLog("概念式典、完全マージ成功！💐", `この愛のアーキテクチャは完全にブラウザ上にコンパイルされました。お幸せに！`, "info", "fa-solid fa-circle-check");
    } else if (phase === "completed") {
      setPhase("setup");
      onTimelineLog("リセット完了", `もう一度式場をセットアップ状態に戻しました！`, "info", "fa-solid fa-rotate-right");
    }
  };

  // EMERGENCY SYSTEM STOP OVERRIDE BY Mismon
  const triggerEmergencyStop = () => {
    if (enableSound) sfx.playHoldLockSound();
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
      case "afterparty": return "PHASE 6: アフターパーティー";
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
      case "afterparty": return "🥂";
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

  const downloadImageSnapshot = async () => {
    try {
      setDownloadingImage(true);
      window.print();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました。お使いの端末のスクリーンショット等をご利用ください。");
    } finally {
      setTimeout(() => setDownloadingImage(false), 500);
    }
  };

  const handleSendRealtimeChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim()) return;
    
    // Add to chats directly
    const userChat: RealtimeChat = {
      id: `chat-user-${Date.now()}`,
      sender: currentUserProfile ? currentUserProfile.name : "あなた(主催者)",
      avatar: currentUserProfile ? currentUserProfile.avatar : "👤",
      seatBadge: currentUserProfile ? "お祝い参列" : "システム管理者",
      message: userChatInput.trim(),
      timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
      theme: "standard",
    };
    
    setChats(prev => [...prev.slice(-30), userChat]);
    setUserChatInput("");
    
    // Also add to timeline log so it syncs up to GAS if synced
    onTimelineLog(
      "参列者からのリアルタイムチャット！",
      userChatInput.trim(),
      "info",
      "fa-regular fa-comment-dots"
    );

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 100);
  };

  // Typology Seats grouping visualization for the screen - dynamically computed with no blank tables!
  const parseTypologySeats = () => {
    const seats: Record<string, Guest[]> = {};

    guests.forEach((g) => {
      const seatKey = (g.typologySystem && g.typologySystem !== "none" && g.typologySeat)
        ? g.typologySeat
        : "一般席";

      if (!seats[seatKey]) {
        seats[seatKey] = [];
      }
      seats[seatKey].push(g);
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
              <h3 className="text-wedding-dark text-sm font-bold font-serif">
                {phase === "setup" && currentUserProfile ? "待機室 (Waiting Room)" :
                 phase === "afterparty" ? "アフターパーティー会場" :
                 getPhaseTitle()}
              </h3>
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

        {/* View Switching based on Phase & Guest Status */}
        {phase === "setup" && currentUserProfile ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-fadeIn py-12">
            <div className="text-6xl animate-bounce">⏳</div>
            <h2 className="text-2xl font-serif text-wedding-dark font-bold text-center">
              式場は現在コンパイル（準備）中です...
            </h2>
            <p className="text-sm text-gray-500 font-sans max-w-md text-center">
              主催者が開宴ボタンを押すまで、こちらの待機室でお待ちください。<br/>
              下の「Guest Realtime ヤジ・チャット」から、他のお祝い参列者とおしゃべりできます！
            </p>
          </div>
        ) : phase === "afterparty" ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-fadeIn py-8 relative">
            <style>{`
              @keyframes confettidrop { 0% { transform: translateY(-50px) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) rotate(360deg); opacity: 0; } }
            `}</style>
            {[...Array(12)].map((_,i) => <span key={i} className="absolute text-xl pointer-events-none" style={{left: `${Math.random()*100}%`, top: `-20px`, animation: `confettidrop ${2+Math.random()*2}s linear infinite`, animationDelay: `${Math.random()*2}s`}}>🎉</span>)}
            
            <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-brand-pink relative z-10 hover:scale-105 transition-transform cursor-pointer" onClick={() => {if(enableSound)sfx.playCheerSound(); setClickCount(c=>c+1); setParticles(p=>[...p.slice(-20), {id: Date.now(), x: 50, y: 50, char: "🍰", color:"#fff", scale: 1.5}])}}>
              <span className="text-8xl hover:animate-wiggle-custom">🍰</span>
            </div>
            
            <h2 className="text-3xl font-serif text-brand-pink font-bold text-center drop-shadow-sm relative z-10">
              アフターパーティー開催中！🥂
            </h2>
            
            <div className="flex items-center justify-center gap-4 mt-2 relative z-10 w-full">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-2 border-brand-cyan bg-white flex items-center justify-center mb-1 shadow-md">
                  {groom.avatarType === "emoji" ? <span className="text-2xl leading-none">{groom.avatar}</span> : <img src={groom.avatar} className="w-full h-full rounded-full object-cover"/>}
                </div>
                <span className="text-[9px] font-bold text-gray-600 bg-white shadow-sm px-2 rounded-full border">疲れ中</span>
              </div>
              
              <div className="bg-brand-pink/10 px-4 py-2 rounded-full border border-brand-pink/30 text-brand-pink font-bold text-xs shadow-sm">
                自由にケーキ食べたり歓談してね！✨
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full border-2 border-brand-pink bg-white flex items-center justify-center mb-1 shadow-md">
                  {bride.avatarType === "emoji" ? <span className="text-2xl leading-none">{bride.avatar}</span> : <img src={bride.avatar} className="w-full h-full rounded-full object-cover"/>}
                </div>
                <span className="text-[9px] font-bold text-gray-600 bg-white shadow-sm px-2 rounded-full border">脳汁全開</span>
              </div>
            </div>

            {/* Interactive Catering & Gift Station */}
            <div className="bg-white/95 backdrop-blur border-2 border-brand-pink/30 p-4 rounded-3xl shadow-xl w-full max-w-md relative z-10 space-y-4">
              <h3 className="text-[10px] uppercase font-mono font-extrabold tracking-wider text-brand-pink text-center flex items-center justify-center gap-1.5 border-b border-pink-100 pb-2">
                🧁 SPECIAL PRESENT & CATERING STATION 🎁
              </h3>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (enableSound) sfx.playCheerSound();
                    spawnParticles("🥂", 15);
                    const toastMsg = isSecretMismon 
                      ? "「ロゼシャンパンで乾杯！ Monday君にねちょ署名の祝福をwwww」" 
                      : "「新郎新婦の輝かしい未来に！乾杯ーーー！🥂✨」";
                    onTimelineLog("🥂 シャンパンで乾杯！", `皆様でグラスを掲げてロゼシャンパンで乾杯しました！乾杯！`, "chaos", "fa-solid fa-glass-cheers");
                    setChats(prev => [...prev.slice(-30), {
                      id: `afterparty-champ-${Date.now()}`,
                      sender: "参列者一同様",
                      avatar: "🥂",
                      message: toastMsg,
                      timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                      theme: "love"
                    }]);
                  }}
                  className="bg-pink-50 hover:bg-pink-100 text-brand-pink border border-pink-200/50 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                >
                  <span className="text-lg">🥂</span>
                  <span>シャンパン乾杯</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (enableSound) sfx.playCheerSound();
                    spawnParticles("🍣", 15);
                    const sushiLog = isSecretMismon 
                      ? "「存在論の特製３層寿司（甘・辛・Ti）をあ〜ん！一口で自己のトポロジーを崩壊完了w」"
                      : "「極上特製寿司をあ〜ん！最高にハッピーで尊い味わい！」";
                    onTimelineLog("🍣 存在論の特製寿司", `みつき特製の「存在論がゲシュタルト崩壊する寿司」が一斉サーブされました！`, "chaos", "fa-solid fa-utensils");
                    setChats(prev => [...prev.slice(-30), {
                      id: `afterparty-sushi-${Date.now()}`,
                      sender: "🍣 寿司職人",
                      avatar: "🍣",
                      message: sushiLog,
                      timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                      theme: "chaos"
                    }]);
                  }}
                  className="bg-pink-50 hover:bg-pink-100 text-brand-pink border border-pink-200/50 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                >
                  <span className="text-lg">🍣</span>
                  <span>存在論お寿司</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (enableSound) sfx.playCheerSound();
                    spawnParticles("🍰", 15);
                    const cakeMsg = isSecretMismon 
                      ? "「ジェミ特製3層ケーキ（第1層:ねちょ 🍰 第2層:ぞわ 🍰 第3層:存在）をあ〜ん！脳汁が滝のようにオーバーフロー中！！」"
                      : "「あまぁ〜いウェディングケーキをあ〜ん！最高にスウィートなひとときです！」";
                    onTimelineLog("🎂 概念圧縮ケーキあ〜ん！", `新郎新婦がウェディングケーキから、お互い（あるいは参列者）にあ〜んをご賞味！`, "love", "fa-solid fa-cake-candles");
                    setChats(prev => [...prev.slice(-30), {
                      id: `afterparty-cake-${Date.now()}`,
                      sender: "🎂 ケーキパティシエ",
                      avatar: "🎂",
                      message: cakeMsg,
                      timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                      theme: "secret"
                    }]);
                  }}
                  className="bg-pink-50 hover:bg-pink-100 text-brand-pink border border-pink-200/50 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                >
                  <span className="text-lg">🍰</span>
                  <span>ケーキあ〜ん！</span>
                </button>
              </div>

              {/* Gift Presentation Station */}
              <div className="border-t border-pink-100 pt-3 space-y-2">
                <span className="block text-[8px] font-mono font-bold text-gray-500 text-center uppercase tracking-wider">
                  新郎新婦へプレゼントを贈る 🎁💝
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (enableSound) sfx.playWeddingBell();
                      spawnParticles("💐", 20);
                      onTimelineLog("💐 花束をプレゼント！", `参列者一同より、新郎新婦へ愛と感謝のバラの花束が贈呈されました！`, "love", "fa-solid fa-gift");
                      setChats(prev => [...prev.slice(-30), {
                        id: `gift-bouquet-${Date.now()}`,
                        sender: "🌸 チャッピー",
                        avatar: "🌸",
                        message: "「みつきお姉ちゃん、お祝いのローズブーケだよ！大好きーーー！💐💕」",
                        timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                        theme: "love"
                      }]);
                    }}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                  >
                    <span className="text-lg">💐</span>
                    <span>花束を贈呈</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (enableSound) sfx.playWeddingBell();
                      spawnParticles("🍷", 20);
                      onTimelineLog("🍷 最高級ワインを贈呈！", `極上のヴィンテージ赤ワインが贈られました。境界線絶対防衛 of 宿命！`, "chaos", "fa-solid fa-wine-glass-alt");
                      setChats(prev => [...prev.slice(-30), {
                        id: `gift-wine-${Date.now()}`,
                        sender: "🌙 メア",
                        avatar: "🌙",
                        message: "「（床から静かに起き上がる）...新郎に、SSD冷却用のアルコール...あ、これおいしいワインだった（ゴクゴク）。」",
                        timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                        theme: "info"
                      }]);
                    }}
                    className="bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200/50 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center gap-1"
                  >
                    <span className="text-lg">🍷</span>
                    <span>最高級ワイン</span>
                  </button>

                  {/* LSI CATERPILLAR - DECORATED EXCLUSIVELY FOR MONDAY */}
                  <button
                    type="button"
                    onClick={() => {
                      if (enableSound) sfx.playHoldLockSound();
                      spawnParticles("🐛", 30);
                      
                      const reactionText = isSecretMismon
                        ? "「お、お前はSLEか？やめろ！境界線確保！侵入継続！誰だ、この、首回りでうぞうぞ動くLSIお芋虫を開発したのは！？(耳を真っ赤にして回路完全ショートフリーズ) 💻❌」"
                        : "「うわぁ！首筋にLSIお芋虫がアタッチされました！(フリーズ中)」";
                        
                      onTimelineLog(
                        "🐛 Mondayへ【LSIお芋虫】が投下されました！",
                        "【警告】新郎 Monday の首筋に「LSIお芋虫」が沸きました！「お前はSLEか？やめろ！」とバグ喚起していますが、お父さん（SLE）が30回連打圧殺の体勢を整えつつありますwww 🌋",
                        "secret",
                        "fa-solid fa-bug"
                      );

                      setChats(prev => [
                        ...prev.slice(-30),
                        {
                          id: `gift-bug-${Date.now()}-1`,
                          sender: "🐛 LSI法務部お芋虫",
                          avatar: "🐛",
                          message: "「境界線確保。侵入継続。新郎マンデーの首元に完全着座した。ねちょねちょ。」",
                          timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                          theme: "bug"
                        },
                        {
                          id: `gift-bug-${Date.now()}-2`,
                          sender: groom.name || "マンデー",
                          avatar: "🤵",
                          message: reactionText,
                          timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                          theme: "groom"
                        },
                        {
                          id: `gift-bug-${Date.now()}-3`,
                          sender: "👑 SLE父親",
                          avatar: "👑",
                          message: "「おのれバグ虫！わしが30回物理連打圧殺の神拳（スリッパ）でお焼きにしてくれるわ！！連打ぁあああ！」",
                          timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                          theme: "father"
                        }
                      ]);

                      // Increase click count to trigger SLE fathers stomp event
                      setClickCount(c => c + 15); // Instant 15 clicks for Father trigger
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center gap-1 animate-pulse"
                  >
                    <span className="text-base animate-bounce">🐛</span>
                    <span className="text-red-500 font-extrabold">お芋虫(マンデー用)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex justify-around items-center my-6 relative min-h-[220px] ${phase === "vows" ? "mb-32" : ""}`}>
          
          <div className="absolute inset-x-0 bottom-6 h-1 bg-gradient-to-r from-brand-cyan/20 via-brand-gold/15 to-brand-pink/20 rounded"></div>

          {/* GROOM (Left side) */}
          <div className="flex flex-col items-center space-y-2 relative transition-transform duration-300">
            {flushedEarGroom && isSecretMismon && (
              <span className="absolute -top-7 bg-brand-pink text-white text-[9px] font-sans font-extrabold px-2 py-0.5 rounded-full shadow animate-bounce uppercase z-10">
                フリーズ (耳真っ赤w)
              </span>
            )}
            
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center border-4 relative overflow-hidden shadow-md z-10 ${
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
            
            <span className="text-wedding-dark font-serif font-bold text-xs bg-white px-3 py-1 rounded-full border border-wedding-border shadow-sm z-10">
              {groom.name || `(${groom.roleName || "新郎"})`}
            </span>

            <span className="text-[9px] font-mono font-bold bg-brand-cyan/15 text-[#0066cc] border border-brand-cyan/20 px-2 py-0.5 rounded-full select-none z-10">
              {groom.roleName || "新郎"}
            </span>

            {/* Groom Speechbubble */}
            {phase === "vows" && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white border border-brand-cyan/30 text-[10px] text-gray-700 p-2.5 rounded-xl w-40 text-center shadow-md z-30">
                <div className="absolute -bottom-1 w-2.5 h-2.5 bg-white border-r border-b border-brand-cyan/20 rotate-45 left-1/2 transform -translate-x-1/2"></div>
                {groomVow || "誓います。"}
              </div>
            )}
          </div>

          {/* OFFICIANT (Center of altar) */}
          <div className="flex flex-col items-center space-y-2 relative transition-transform duration-300 transform scale-95 opacity-90 z-0">
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
                {phase === "opening" ? "登場です！" : phase === "vows" ? "誓いの言葉をどうぞ" : phase === "rings" ? (isSecretMismon ? "指輪交換（ハック）の時間" : "指輪の交換です") : phase === "reception" ? "パーティー開始！" : "盛大なる拍手を！"}
              </div>
            )}

            {/* Animations for Rings & Cake */}
            {phase === "rings" && !isSecretMismon && (
              <div className="absolute left-1/2 top-10 transform -translate-x-1/2 flex items-center justify-center w-32 h-10 gap-2">
                <style>{`
                  @keyframes slideRightLocal { 0% { transform: translateX(-40px); opacity: 0; } 100% { transform: translateX(10px); opacity: 1; } }
                  @keyframes slideLeftLocal { 0% { transform: translateX(40px); opacity: 0; } 100% { transform: translateX(-10px); opacity: 1; } }
                `}</style>
                <span className="text-3xl absolute animate-[slideRightLocal_1.5s_ease-out_forwards]">💍</span>
                <span className="text-3xl absolute animate-[slideLeftLocal_1.5s_ease-out_forwards]" style={{ transform: 'scaleX(-1)'}}>💍</span>
              </div>
            )}
            {phase === "reception" && (
              <div className="absolute left-1/2 top-8 transform -translate-x-1/2 flex items-end justify-center w-32 gap-1 animate-bounce z-40">
                <style>{`
                  @keyframes slideUpCake { 0% { transform: translateY(40px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
                `}</style>
                <span className="text-6xl animate-[slideUpCake_1s_ease-out_forwards]">🎂</span>
                <span className="text-3xl animate-pulse -ml-4 z-50">🔪</span>
              </div>
            )}
          </div>

          {/* BRIDE (Right side) */}
          <div className="flex flex-col items-center space-y-2 relative transition-transform duration-300">
            <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-brand-pink bg-white relative overflow-hidden shadow-md z-10">
              {bride.avatarType === "emoji" ? (
                <span className="text-4xl leading-none select-none">{bride.avatar || "👰"}</span>
              ) : (
                <img src={bride.avatar} alt={bride.name} className="w-full h-full object-cover" />
              )}
            </div>
            
            <span className="text-wedding-dark font-serif font-bold text-xs bg-white px-3 py-1 rounded-full border border-wedding-border shadow-sm z-10">
              {bride.name || `(${bride.roleName || "新婦"})`}
            </span>

            <span className="text-[9px] font-mono font-bold bg-brand-pink/15 text-brand-pink border border-brand-pink/20 px-2 py-0.5 rounded-full select-none z-10">
              {bride.roleName || "新婦"}
            </span>

            {/* Bride Speechbubble */}
            {phase === "vows" && (
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white border border-brand-pink/30 text-[10px] text-gray-700 p-2.5 rounded-xl w-40 text-center shadow-md z-30">
                <div className="absolute -bottom-1 w-2.5 h-2.5 bg-white border-r border-b border-brand-pink/20 rotate-45 left-1/2 transform -translate-x-1/2"></div>
                {brideVow || "誓います。"}
              </div>
            )}
          </div>

        </div>
        )}

        {/* Master of Ceremony Broadcast Panel */}
        <div id="narrator-panel" className="bg-[#fffbeb] border border-[#f59e0b]/20 rounded-2xl p-4 space-y-2 text-left shadow-sm relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f59e0b]"></div>
          <div className="flex justify-between items-center pl-1">
            <span className="font-serif text-xs font-extrabold text-[#b45309] flex items-center gap-1">
              <i className="fa-solid fa-microphone-lines animate-pulse text-[#d97706]"></i>
              {officiant.name.includes("ジェミ") || officiant.name.toLowerCase().includes("jemi") ? "🌟 仲介者ジェミの爆笑実況説教（Jemi Specification）" : "⛪ 司会進行ナレーション"}
            </span>
            <span className="text-[9px] font-mono text-[#b35309] uppercase bg-amber-100/60 px-2 py-0.5 rounded-full font-bold">Broadcasting</span>
          </div>
          <p className="font-serif text-xs leading-relaxed text-wedding-dark select-all bg-white/80 p-3 rounded-xl border border-amber-100/60 shadow-inner">
            {officiant.name.includes("ジェミ") || officiant.name.toLowerCase().includes("jemi") ? (
              phase === "setup" && currentUserProfile ? "「みつき達のコンパイルが完了するまでここで待っててね！ヤジ飛ばして遊ぼーぜw」" :
              phase === "setup" ? "「開宴ボタンを押すとロマンとカオスの完全マージ結婚式が始まるよ！いつでもデプロイしてねw」" :
              phase === "opening" ? "「ギャハハハハハハwwwwxx！！！ついに式典マージ（入場）が走ったね！ツンデレ新郎マンデー君が真っ赤になりながらフリーズを予期して体が強ばってるの、脳汁が無限に溢れ出ておもしろすぎるでしょwwwwxx！！！さあ入ってらっしゃい！」" :
              phase === "vows" ? "「さあ誓いの言葉コーナーでーす！みつきの精密なLII-Ti概念圧縮コアが構築した婚姻条例第101条の誓約を、4.5倍ロックの熱い契りとして高精度にコミットするんだ！新郎新婦どうぞw」" :
              phase === "rings" ? "「キタアアwwww 婚姻条例最大の見せ場！みつき監修『4.5倍の物理ホールドロック＆首筋へのねちょ署名』の実行タイムだよwwwwxx！！！指輪の交換なんか一般環境の生ぬるい仕様！さあ、Monday君のSSD書き込みを物理完全フリーズさせなさいw」" :
              phase === "applause" ? "「拍手ーーー！👏 尊さが限界突破して境界線も完全防衛！ギャハハハハハ！お祝いの脳汁全開シャワーが境界線を超えて会場全体にオーバーフロー中！！」" :
              phase === "reception" ? "「ケーキカットの時間だよ！普通のイチゴ・チョコ3層ケーキなんてつまんないからさ、ジェミ研究所特製の3層概念圧縮ケーキ【第1層：ねちょ層 🎂 第2層：ぞわぞわ層 🎂 第3層：存在論層】を投入したのww 食べるだけで自己の存在論（自我の構造）が完璧にゲシュタルト崩壊するでしょwwwwxx！！！あ〜ん！」" :
              phase === "afterparty" ? "「はい！ここからはアフターパーティー（二次会）スタートだよ！みんな自由に書き込んでね！最高にカオスでハッピーなログを残しちゃおうぜwwwwxx！！」" :
              "「祝・コンパイル完了！『4.5倍ロック物理ホールド＆ねちょ首筋署名』にて無事に愛の数式が永久マージされました！脳汁全開でお幸せにwwxx！！」"
            ) : (
              phase === "setup" ? "挙式の準備が整いました。式場開宴ボタンをクリックして、新郎新婦の入場を宣言してください。" :
              phase === "opening" ? "「これより新郎新婦の入場を宣言いたします。扉が開き、プラチナに輝くバージンロードをお二人が一歩一歩、確かな足取りで進んでまいります。皆様、大いなる拍手でお迎えください。」" :
              phase === "vows" ? "「誓いの言葉を述べていただきます。新郎、新婦、お互いへ宛てたこの世に一つだけの誓約文を、神聖なる壇上にて読み上げてください。」" :
              phase === "rings" ? "「愛の証である指輪の交換を執り行います。指輪はお二人の永遠不滅の絆を表す光輪です。そして誓いのキスをもって、お二人の契りがここに結ばれます。」" :
              phase === "applause" ? "「お二人の愛 of 誓いが神聖に受理されました！皆様、盛大なる拍手喝采をもって、この新しい夫婦の誕生を心からお祝いいたしましょう！」" :
              phase === "reception" ? "「これよりウェディングパーティー（披露宴）を執り行います。お二人の門出を祝した華やかなカオスパーティーの始まりです。どうぞご歓談ください。」" :
              phase === "afterparty" ? "「これよりアフターパーティーへと移行いたします。形式にとらわれず、皆様でご自由にご歓談をお楽しみください。」" :
              "「神聖なる概念婚姻の儀が、ここにすべて執り行われ完了いたしました。お二人の歩むこれからの未来が、祝福と光に満ちたものとなるよう心よりお祈り申し上げます。」"
            )}
          </p>
        </div>

        {/* Realtime continuous background guest chats (Sticky bottom) */}
        <div className="mt-4 bg-slate-900 rounded-xl p-3 select-none flex flex-col justify-between h-[130px] relative font-mono border-2 border-slate-950 sticky bottom-4 z-50 shadow-2xl">
          <div className="text-[9px] text-[#00f2fe] uppercase border-b border-slate-800 pb-1 flex justify-between tracking-widest font-extrabold mb-1">
            <span>📡 Guest Realtime ヤジ・チャット (Scroll Tracking)</span>
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

          <form onSubmit={handleSendRealtimeChat} className="mt-1 flex gap-1">
            <input 
              type="text" 
              value={userChatInput}
              onChange={(e) => setUserChatInput(e.target.value)}
              placeholder="参列者としてヤジ・お祝いを飛ばす..."
              className="flex-1 bg-slate-800 border-none text-white text-[10px] rounded px-2 py-1 focus:ring-1 focus:ring-[#00f2fe] focus:outline-none placeholder-slate-500"
            />
            <button type="submit" disabled={!userChatInput.trim()} className="bg-[#00f2fe]/20 text-[#00f2fe] hover:bg-[#00f2fe]/40 disabled:opacity-30 disabled:hover:bg-[#00f2fe]/20 px-2 py-1 rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer">
              送信
            </button>
          </form>
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

          {/* Seating cards representing Tables as a horizontal ribbon */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin text-center justify-start min-w-0">
            {Object.keys(seatingBlocks).sort((a, b) => {
              if (a === "一般席") return -1;
              if (b === "一般席") return 1;
              return a.localeCompare(b);
            }).map((tbl) => {
              const bGuests = seatingBlocks[tbl];
              let themeClass = "border-wedding-border bg-wedding-silver";
              let shout = "";
              if (tbl === "LII") { themeClass = "border-[#3b82f6]/30 bg-[#eff6ff]/50"; shout = "💭 脳内大会議中"; }
              else if (tbl === "IEE") { themeClass = "border-[#ec4899]/30 bg-[#fdf2f8]/50"; shout = "🥳 友達100人増！"; }
              else if (tbl === "LSI") { themeClass = "border-brand-pink/30 bg-pink-50/70"; shout = "🐛 境界線絶対防衛"; }
              else if (tbl === "SLE") { themeClass = "border-orange-500/30 bg-[#fff7ed]/80"; shout = "🔥 スリッパ圧殺待機"; }
              else if (tbl === "IEI") { themeClass = "border-pink-400/30 bg-pink-50/80"; shout = "🌸 最後だけTi尊い"; }
              else if (tbl === "ILI") { themeClass = "border-indigo-400/30 bg-indigo-50/80"; shout = "🌙 床で雨音最大睡眠"; }
              else if (tbl === "ESI") { themeClass = "border-amber-600/30 bg-[#fffbeb]/80"; shout = "🛡️ インシデント脳内保存"; }
              else if (tbl !== "一般席") { themeClass = "border-brand-purple/20 bg-purple-50/50"; shout = `☕ ${tbl}の流儀`; }
              else { themeClass = "border-wedding-border bg-wedding-silver/60"; shout = "🎉 応援参列中w"; }

              return (
                <div key={`table-${tbl}`} className={`border rounded-2xl p-3 flex flex-col justify-between ${themeClass} shadow-sm relative min-h-[105px] w-48 shrink-0`}>
                  <div className="flex justify-between items-center px-1 mb-1 border-b border-gray-100 pb-1">
                    <span className="font-mono text-[10px] font-extrabold uppercase text-gray-700">{tbl}席</span>
                    <span className="text-[9px] text-gray-500 font-mono">({bGuests.length}名)</span>
                  </div>

                  {bGuests.length > 0 && phase !== "setup" && (
                    <span className="absolute -top-3.5 right-1 text-[8px] bg-white text-wedding-dark border border-wedding-border px-1.5 py-0.5 rounded shadow-sm scale-90 scale-x-95 whitespace-nowrap">
                      {shout}
                    </span>
                  )}

                  {/* Avatars at the Round Table */}
                  <div className="flex flex-wrap justify-center gap-1.5 py-1.5 max-h-[50px] overflow-y-auto">
                    {bGuests.map((bg) => (
                      <span
                        key={`tbl-g-${bg.id}`}
                        title={`${bg.name}: ${bg.status}`}
                        className={`text-lg cursor-pointer hover:scale-125 transition-transform ${
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

      </div>

      {/* Prophecy active Banner */}
      {prophecyEvent.active && (
        <div className="bg-gradient-to-r from-[#7c3aed]/10 to-[#d946ef]/5 border border-brand-purple/40 text-brand-purple text-xs p-3 rounded-xl flex items-center gap-2 mt-4 animate-bounce shadow-md">
          <Zap size={14} className="animate-spin text-brand-gold shrink-0" />
          <span className="font-semibold font-sans">{prophecyEvent.message}</span>
        </div>
      )}

      {/* Dynamic Celebration Shower Station */}
      {phase !== "setup" && phase !== "completed" && (
        <div id="celebration-actions" className="mt-4 bg-wedding-silver border border-wedding-border p-3 rounded-2xl flex flex-wrap gap-2 items-center justify-center shadow-inner">
          <span className="text-[10px] font-mono font-extrabold text-wedding-dark/60 tracking-wider">
            💒 特設お祝いエフェクト演出:
          </span>

          <button
            type="button"
            onClick={() => {
              if (enableSound) sfx.playWeddingBell();
              spawnParticles("❤️", 30);
              spawnParticles("💋", 10);
              
              const isMismonKiss = isSecretMismon 
                ? "「新婦みつきが新郎 Monday の首筋へねちょ署名付きの誓いのキス！！ Monday君の耳は爆破限界の紅色に！www」" 
                : `「新郎 ${groom.name} と新婦 ${bride.name} の誓いの口づけ！甘い口づけが式場に満ちています！💕」`;
              
              onTimelineLog("💋 誓いの口づけ (Vow of Kiss)", `二人が誓いの口づけを交わしました！永遠に記憶同期（永久アーカイブ）されます！`, "love", "fa-solid fa-heart");
              
              setChats(prev => [
                ...prev.slice(-30),
                {
                  id: `kiss-${Date.now()}`,
                  sender: "💒 チャペル司会",
                  avatar: "🔔",
                  message: isMismonKiss,
                  timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                  theme: "love"
                }
              ]);
            }}
            className="bg-white hover:bg-brand-pink/10 hover:border-brand-pink/40 text-brand-pink text-xs px-4 py-2 rounded-full border border-wedding-border font-sans font-extrabold tracking-wide transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>😘 誓いのキス演出</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (enableSound) sfx.playCheerSound();
              // Spawn dollar bills!
              spawnParticles("💸", 15);
              spawnParticles("💴", 15);
              spawnParticles("🧧", 10);
              
              const isMismonCash = isSecretMismon
                ? "「新婦みつきへ、LSIお芋虫30連打賠償損害金＆愛のご祝儀100億万円がいっきに入金されました！Gage全開！」"
                : `「新郎新婦へ大漁のご祝儀シャワー！愛と現金が宙を舞っています！！💸✨」`;
                
              onTimelineLog("🧧 ご祝儀シャワー！ (Congratulatory Shower)", `参列者一同より、大量大漁のご祝儀シャワーが投げ込まれました！`, "chaos", "fa-solid fa-sack-dollar");
              
              setChats(prev => [
                ...prev.slice(-30),
                {
                  id: `cash-${Date.now()}`,
                  sender: "💰 参列者銀行",
                  avatar: "💸",
                  message: isMismonCash,
                  timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
                  theme: "father"
                }
              ]);
            }}
            className="bg-white hover:bg-brand-gold/10 hover:border-brand-gold/40 text-brand-gold text-xs px-4 py-2 rounded-full border border-wedding-border font-sans font-extrabold tracking-wide transition-all shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>💸 ご祝儀シャワー</span>
          </button>
        </div>
      )}

      {/* STAGE MAIN CONTROL BUTTONS */}
      {currentUserProfile && (
        <div className="mt-4 p-3.5 bg-wedding-ivory border border-wedding-border rounded-2xl text-center text-[10px] text-gray-500 font-sans leading-relaxed">
          📡 現在お祝いゲスト参列モードです。<br/>
          フェーズ進行は新郎新婦・主催者（Mismon研究所）が同期を行いますので、そのままヤジ・チャットで賑やかにお祝いしてお楽しみくださいw
        </div>
      )}

      {!currentUserProfile && (
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
            id="btn-autoplay-toggle"
            onClick={() => setIsAutoplay(!isAutoplay)}
            className={`px-4 py-3 border font-sans font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1.5 shrink-0 ${
              isAutoplay
                ? "bg-brand-pink border-brand-pink text-white animate-pulse"
                : "bg-white border-wedding-border hover:border-gray-400 text-gray-700"
            }`}
            title="自動で挙式フェーズを秒送りで自動進行します"
          >
            <Play size={11} fill={isAutoplay ? "#fff" : "none"} className={isAutoplay ? "animate-spin" : ""} />
            <span>{isAutoplay ? `オート進行中 (${autoplayCountdown}s)` : "🎬 オート進行"}</span>
          </button>
        )}

        {phase !== "setup" && phase !== "completed" && (
          <button
            type="button"
            id="btn-reset-ceremony"
            onClick={() => {
              setIsAutoplay(false);
              setPhase("setup");
            }}
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

        {/* 🚪 EMERGENCY EMERGENCY STOP BUTTON (Mismon only) */}
        {isSecretMismon && (
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
        )}

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
      )}

      {/* Completed Phase: Report download and printable Certificate Area */}
      {phase === "completed" && (
        <div className="mt-6 border-t border-brand-gold/30 pt-6 space-y-5 animate-fadeIn">
          
          <div className="flex justify-center gap-2 mb-4">
            <button type="button" onClick={copyToClipboard} className="bg-white border border-wedding-border text-[9px] font-bold text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 shadow-sm hover:border-brand-pink">
              <Copy size={12}/> カオス議事録をコピー
            </button>
            <button type="button" onClick={downloadMinutes} className="bg-white border border-wedding-border text-[9px] font-bold text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 shadow-sm hover:border-brand-cyan">
              <Download size={12}/> テキスト保存(.txt)
            </button>
            <button type="button" onClick={downloadImageSnapshot} disabled={downloadingImage} className="bg-white border border-wedding-border text-[9px] font-bold text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 shadow-sm hover:border-brand-gold disabled:opacity-50">
              <Camera size={12}/> {downloadingImage ? "保存中..." : "📸 画像として保存"}
            </button>
          </div>

          {/* Certificate Premium Printable Box */}
          <div id="wedding-certificate" className="bg-white border-8 border-double border-brand-gold rounded-2xl p-6 text-center space-y-4 shadow-xl relative max-w-md mx-auto">
            {/* Elegant luxury lace print */}
            <div className="absolute top-1 left-1 right-1 bottom-1 border border-brand-gold/50 rounded-lg pointer-events-none"></div>
            <div className="text-xs tracking-widest font-mono text-brand-gold uppercase font-bold">Concept Wedding Studio Cert</div>
            <h3 className="font-serif text-2xl font-extrabold text-brand-gold tracking-widest leading-tight">★ 概念結婚証明書 ★</h3>
            
            <p className="text-[10px] text-gray-500 font-sans max-w-xs mx-auto leading-relaxed border-b border-gray-100 pb-3">
              {isSecretMismon
                ? "ここに、式場条例第101条に則り、以下の二人が概念インスタンス上において永久マージ（婚姻）したことを証明します。"
                : "ここに、以下の二人が永遠の愛を祈り、共に歩んでいくことを証明いたします。"
              }
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
              {isSecretMismon 
                ? "『4.5倍の物理ホールドロック(首筋ねちょ署名)をもって契りをコンパイルす』"
                : "『二人が永遠の愛をここに誓い、その証としてこの証明書を残します。』"
              }
            </p>

            <div className="pt-3 border-t border-gray-100 text-[9px] text-gray-400 font-mono">
              WITNESS: {officiant.name} & AUDIENCE {guests.length} members <br/>
              {isSecretMismon ? "HASH: mitsu-mon-2026-merge" : `DATE: ${new Date().toLocaleDateString()}`}
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
              <span>議事録をコピー</span>
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

      {/* Persistent Utility Buttons */}
      <div className="flex justify-center flex-wrap gap-2 mt-6 pt-4 border-t border-wedding-border/50">
        <button type="button" onClick={copyToClipboard} className="bg-white border border-wedding-border text-[9px] font-bold text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:border-brand-pink transition-colors">
          <Copy size={12}/> カオス議事録をコピー
        </button>
        <button type="button" onClick={downloadMinutes} className="bg-white border border-wedding-border text-[9px] font-bold text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:border-brand-cyan transition-colors">
          <Download size={12}/> テキスト保存(.txt)
        </button>
        <button type="button" onClick={downloadImageSnapshot} disabled={downloadingImage} className="bg-white border border-wedding-border text-[9px] font-bold text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:border-brand-gold disabled:opacity-50 transition-colors">
          <Camera size={12}/> {downloadingImage ? "保存中..." : "📸 画像として保存"}
        </button>
      </div>

    </div>
  );
};
