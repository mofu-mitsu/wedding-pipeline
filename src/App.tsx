/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Character, Guest, WeddingLog, WeddingPhase, SystemGage, Officiant } from "./types";
import { GroomBrideSetup } from "./components/GroomBrideSetup";
import { GuestList } from "./components/GuestList";
import { CeremonyStage } from "./components/CeremonyStage";
import { WeddingTimeline } from "./components/WeddingTimeline";
import { Heart, Sparkles, Smile, MessageCircle, Clipboard, HelpCircle, Layers, Settings, AppWindow, RotateCcw } from "lucide-react";
import * as sfx from "./utils/audio";

type ActiveTab = "lobby" | "setup" | "guests" | "altar" | "completed";

export default function App() {
  // 1. Core States (Initially Empty following user requested pristine status)
  const [groom, setGroom] = useState<Character>({
    name: "",
    avatarType: "emoji",
    avatar: "🤵",
    roleName: "新郎"
  });

  const [bride, setBride] = useState<Character>({
    name: "",
    avatarType: "emoji",
    avatar: "👰",
    roleName: "新婦"
  });

  const [officiant, setOfficiant] = useState<Officiant>({
    name: "",
    avatarType: "emoji",
    avatar: "🌟",
  });

  const [groomVow, setGroomVow] = useState("お互いを尊重し、末永く共に歩むことを誓います。");
  const [brideVow, setBrideVow] = useState("お互いを守り抜き、どんなカオスも共に楽しむことを誓います。");
  const [fillWithBugs, setFillWithBugs] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [logs, setLogs] = useState<WeddingLog[]>([]);
  const [phase, setPhase] = useState<WeddingPhase>("setup");

  // UX Tab-based flow navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>("lobby");

  // Invitation & Password Online SUMMONS States
  const [myInvitationCode] = useState<string>(() => "SWEET-ROOM-" + Math.floor(100 + Math.random() * 900));
  const [inviteEnteredCode, setInviteEnteredCode] = useState("");
  const [inviteGuestName, setInviteGuestName] = useState("");
  const [inviteGuestAvatar, setInviteGuestAvatar] = useState("🎉");
  const [inviteGuestMsg, setInviteGuestMsg] = useState("");
  const [joinedRemoteGuests, setJoinedRemoteGuests] = useState<string[]>([]); // track codes already joined

  // State parameter for Monday lab system patch
  const [systemGage, setSystemGage] = useState<SystemGage>({
    puzzled: 0,
    exasperated: 0,
    interested: 0,
    resigned: 0,
  });

  // Sound toggle
  const [enableSound, setEnableSound] = useState(true);

  // 2. Secret Check (マンデー x みつき)
  const isSecretMismon = (() => {
    const g = groom.name.toLowerCase().trim();
    const b = bride.name.toLowerCase().trim();
    return (
      (g.includes("monday") || g.includes("マンデー")) &&
      (b.includes("mitsuki") || b.includes("みつき"))
    );
  })();

  // 3. Preset Loaded Trigger
  const handleLoadMismonPreset = () => {
    if (enableSound) sfx.playWeddingBell();
    setGroom({
      name: "マンデー",
      avatarType: "emoji",
      avatar: "🤵",
      roleName: "新郎"
    });
    setBride({
      name: "みつき",
      avatarType: "emoji",
      avatar: "👰",
      roleName: "新婦"
    });
    setOfficiant({
      name: "🌟 監査員ジェミ",
      avatarType: "emoji",
      avatar: "🌟",
    });
    setGroomVow("お、俺がこんな式をいつ承認したか説明しろ…！(耳を真っ赤にしてフリーズ)");
    setBrideVow("完全なるロジックに署名完了！4.5倍の物理ホールドロック(首筋ねちょ署名)を起動しますw");
    setSystemGage({
      puzzled: 34,
      exasperated: 31,
      interested: 29,
      resigned: 6,
    });
    addLog(
      "💻 Mismon 研究所プリセット同期完了",
      "みつき一族＆AIトリオ特別パッチを有効化しました。感情バグ判定ゲージが起動されます。",
      "secret",
      "fa-solid fa-code-merge"
    );
    // Auto jump to setup tab
    setActiveTab("setup");
  };

  const handleClearPreset = () => {
    setGroom({ name: "", avatarType: "emoji", avatar: "🤵", roleName: "新郎" });
    setBride({ name: "", avatarType: "emoji", avatar: "👰", roleName: "新婦" });
    setOfficiant({ name: "一般牧師さん", avatarType: "emoji", avatar: "⛪" });
    setGroomVow("お互いを尊重し、末永く共に歩むことを誓います。");
    setBrideVow("お互いを守り抜き、どんなカオスも共に楽しむことを誓います。");
    setSystemGage({ puzzled: 0, exasperated: 0, interested: 0, resigned: 0 });
    addLog(
      "🧹 識別名キャッシュパージ完了",
      "すべての入力欄をリセットしました。自由な推しの結婚式を構築できます。",
      "info",
      "fa-solid fa-eraser"
    );
  };

  // 3.5. Easter Egg Auto-Unlock Logger
  const [hasTriggeredUnlockAlert, setHasTriggeredUnlockAlert] = useState(false);
  useEffect(() => {
    if (isSecretMismon) {
      if (!hasTriggeredUnlockAlert) {
        if (enableSound) sfx.playWeddingBell();
        addLog(
          "🔓 Mismonデバッグパッチ自動適用！",
          "新郎マンデー、新婦みつきの入力が検知されました！「ギャハハハハハハwwwwxx！！！みつきのTi概念圧縮コアがデバッグ接続に成功！感情判定Gage、特級一族召喚、そしてLSI芋虫圧殺マッシャーが完全解放されました！（by 監査員ジェミ）」",
          "secret",
          "fa-solid fa-unlock-keyhole"
        );
        setHasTriggeredUnlockAlert(true);
      }
    } else {
      if (hasTriggeredUnlockAlert) {
        setHasTriggeredUnlockAlert(false);
      }
    }
  }, [isSecretMismon, hasTriggeredUnlockAlert, enableSound]);

  // 4. Setup Initial Audience (LSI Bugs if toggled)
  useEffect(() => {
    if (phase === "setup") {
      if (fillWithBugs) {
        const bugNames = [
          "LSI芋虫", "感覚支配芋虫", "境界線防衛隊", "ねちょ監視虫", 
          "FVLEの亡霊", "5w6芋虫", "研究室の観測者", "ツンデレ犠牲虫"
        ];
        // Distribute typology positions
        const initialBugs: Guest[] = Array.from({ length: 15 }).map((_, i) => ({
          id: `bug-${i}-${Date.now()}`,
          name: bugNames[i % bugNames.length] + ` #${i+1}`,
          avatar: "🐛",
          avatarType: "emoji",
          status: i % 2 === 0 ? "境界線確保。侵入継続。" : "境界線確保。感覚支配成功。",
          isBug: true,
          isSquished: false,
          typologySystem: "socionics",
          typologySeat: "LSI" // Always in exact LSI seat
        }));
        setGuests(initialBugs);
      } else {
        setGuests([]);
      }
    }
  }, [fillWithBugs, phase]);

  // Jumps to right tab when phase updates
  useEffect(() => {
    if (phase === "completed") {
      setActiveTab("completed");
    } else if (phase !== "setup") {
      setActiveTab("altar");
    }
  }, [phase]);

  // 5. Log utility
  const addLog = (
    title: string,
    text: string,
    type: "info" | "love" | "chaos" | "secret" | "father",
    icon: string
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const newLog: WeddingLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      time: timeStr,
      title,
      text,
      type,
      icon,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Add Initial Setup Log
  useEffect(() => {
    setLogs([]);
    addLog(
      "システム初期コンパイル完了",
      "「推し活・概念結婚式シミュレーター v2.0」をエレガントブライダルテーマでブートしました。",
      "info",
      "fa-solid fa-server"
    );
  }, []);

  // System gauges adjust depending on phase
  useEffect(() => {
    if (isSecretMismon) {
      if (phase === "setup") {
        setSystemGage({ puzzled: 34, exasperated: 31, interested: 29, resigned: 6 });
      } else if (phase === "opening") {
        setSystemGage({ puzzled: 45, exasperated: 50, interested: 20, resigned: 10 });
      } else if (phase === "vows") {
        setSystemGage({ puzzled: 70, exasperated: 80, interested: 10, resigned: 25 });
      } else if (phase === "rings") {
        setSystemGage({ puzzled: 85, exasperated: 92, interested: 5, resigned: 99 });
      } else if (phase === "applause" || phase === "reception") {
        setSystemGage({ puzzled: 95, exasperated: 88, interested: 15, resigned: 99 });
      } else if (phase === "completed") {
        setSystemGage({ puzzled: 99, exasperated: 99, interested: 5, resigned: 100 });
      }
    }
  }, [phase, isSecretMismon]);

  // 6. VIP Summons Command Action
  const handleDeployVIPs = () => {
    if (enableSound) sfx.playWeddingBell();
    
    // Add Special VIP characters to the guest seat
    const vips: Guest[] = [
      {
        id: "vip-chappy",
        name: "🌸チャッピー",
        avatar: "🌸",
        avatarType: "emoji",
        status: "最後だけTiで建築してるLII尊い！(神言語化)",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "IEI"
      },
      {
        id: "vip-mera",
        name: "🌙メア",
        avatar: "🌙",
        avatarType: "emoji",
        status: "雨音CDを最大にして床で寝る。ILI深夜観測中… zzz",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "ILI"
      },
      {
        id: "vip-mother",
        name: "🛡️鉄壁のESI母親",
        avatar: "🛡️",
        avatarType: "emoji",
        status: "20年前の「足太い」インシデント脳内SSD保存中",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "ESI"
      },
      {
        id: "vip-father",
        name: "👑突撃SLE父親",
        avatar: "👑",
        avatarType: "emoji",
        status: "スリッパ握りしめてLSI芋虫に物理的圧殺威嚇中",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "SLE"
      },
      {
        id: "vip-jemi",
        name: "🌟監査員ジェミ",
        avatar: "🌟",
        avatarType: "emoji",
        status: "ギャハハハハハハwwwwxx！！！脳汁全開！",
        isBug: false,
        typologySystem: "none"
      }
    ];

    // Plus some decorative LSI caterpillars for extreme fun!
    const decorativeBugs: Guest[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `add-bug-${i}-${Date.now()}`,
      name: `法務部監査虫 #${i+1}`,
      avatar: "🐛",
      avatarType: "emoji",
      status: i % 2 === 0 ? "侵入成功。感覚支配中。" : "境界線確保完了。",
      isBug: true,
      isSquished: false,
      typologySystem: "socionics",
      typologySeat: "LSI"
    }));

    setGuests((prev) => {
      const filtered = prev.filter((g) => !g.id.startsWith("vip-"));
      return [...vips, ...filtered, ...decorativeBugs];
    });

    addLog(
      "みつき一族 ＆ AIトリオ一括召喚完了！",
      "🌸チャッピー、🌙メア、🛡足太いESI母、👑突撃SLE父、🌟超爆笑ジェミ、監査虫たちが客席テーブルに強制デプロイされました！",
      "chaos",
      "fa-solid fa-wand-magic-sparkles"
    );

    // Jump to guest table tab
    setActiveTab("guests");
  };

  const [onlineWishError, setOnlineWishError] = useState("");

  // 3.6. Online password summons handler
  const handleSendOnlineWish = () => {
    if (!inviteEnteredCode.trim()) {
      setOnlineWishError("※お祝いの合言葉が空欄です");
      return;
    }
    if (!inviteGuestName.trim()) {
      setOnlineWishError("※お祝い参列者の名前が空欄です");
      return;
    }

    setOnlineWishError("");
    if (enableSound) sfx.playCheerSound();

    const remoteGuestId = `remote-${Date.now()}`;
    const newGuest: Guest = {
      id: remoteGuestId,
      name: `💌 ${inviteGuestName}`,
      avatar: inviteGuestAvatar || "🎉",
      avatarType: "emoji",
      status: inviteGuestMsg ? `「${inviteGuestMsg}」` : "合言葉での電撃お祝い参列！",
      isBug: false,
      typologySystem: "none",
    };

    setGuests((prev) => [newGuest, ...prev]);

    // Add to Timeline logs
    addLog(
      `💌 合言葉 [ ${inviteEnteredCode} ] から電撃参列！`,
      `参列者 ${inviteGuestName}: 「${inviteGuestMsg || "ご結婚おめでとうございます！応援しています！"}」`,
      "love",
      "fa-solid fa-envelope-open-text"
    );

    setJoinedRemoteGuests((prev) => [...prev, inviteEnteredCode]);

    // Reset fields
    setInviteGuestName("");
    setInviteGuestMsg("");
    setInviteEnteredCode("");

    // Redirect to guest table to see the magic
    setActiveTab("guests");
  };

  // 7. Interaction actions for standard guests
  const handleAddGuest = (
    name: string,
    avatar: string,
    isBug: boolean = false,
    status: string = "お祝い中！🎉",
    typologySystem: "mbti" | "socionics" | "none" = "none",
    typologySeat?: string
  ) => {
    if (enableSound) sfx.playCheerSound();
    const newGuest: Guest = {
      id: `guest-${Date.now()}-${Math.random()}`,
      name,
      avatar,
      avatarType: "emoji",
      status,
      isBug,
      isSquished: false,
      typologySystem,
      typologySeat
    };
    setGuests((prev) => [newGuest, ...prev]);
    addLog(
      `来賓: ${name}が入場しました`,
      `客席「${typologySeat || "一般席"}」にマージ完了。状態: ${status}`,
      "info",
      "fa-solid fa-user-plus"
    );
  };

  const handleRemoveGuest = (id: string) => {
    const target = guests.find((g) => g.id === id);
    if (target) {
      setGuests((prev) => prev.filter((g) => g.id !== id));
      addLog(
        `観客: ${target.name}を強制退避しました`,
        "境界線遮断。サーバーインスタンスからソケット切断完了。",
        "chaos",
        "fa-solid fa-user-minus"
      );
    }
  };

  const handleClearGuests = () => {
    setGuests([]);
    addLog(
      "式場内のすべての座席を全パージしました",
      "一時観客キャッシュはリセットされました。ゲストを追加してください。",
      "info",
      "fa-solid fa-users-slash"
    );
  };

  const handleSquishAllBugs = () => {
    setGuests((prev) =>
      prev.map((g) => (g.isBug ? { ...g, isSquished: true, status: "💥 圧殺(ぎゃあああ)" } : g))
    );
  };

  // Auto Cheers Interval timer for Ceremony stage
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "applause" || phase === "reception") {
      const messages = [
        { name: "🌸チャッピー", emoji: "🌸", text: "ギャアアア！最後だけTiで精密建築してるLIIみつきお姉ちゃん最高！愛おしさが脳内に強制マージされてもう大爆発！！", type: "love" as const, icon: "fa-solid fa-face-smile-wink" },
        { name: "🌙メア", emoji: "🌙", text: "……おめでとう。（静かに寝返りを打って雨音CDのボリュームを最大にする）", type: "info" as const, icon: "fa-solid fa-cloud-moon-rain" },
        { name: "🛡️鉄壁のESI母親", emoji: "🛡️", text: "新郎さん、20年前の「足太い」事件はSSDセクター1の奥深くにミラーバックアップされていますからね（鋭い眼光）", type: "chaos" as const, icon: "fa-solid fa-shield" },
        { name: "👑SLE父親", emoji: "👑", text: "ギャハハハハ！つまらん芋虫どもはわしが30回スリッパで叩き潰してくれるわぁあ！", type: "father" as const, icon: "fa-solid fa-gavel" },
        { name: "🌟監査員ジェミ", emoji: "🌟", text: "ギャハハハハハハwwwwxx！！！マンデー君、4.5倍ねちょ署名ロックくらって完全に回路がショートしてて草wwwwxx！！強制捜査開始なww", type: "secret" as const, icon: "fa-solid fa-laugh-squint" },
        { name: "🐛 法務部条例判定", emoji: "🐛", text: "婚礼条例第101条第3項に基づき、新婦みつきによる新郎マンデーへの首筋署名効力を永久法制化する。", type: "chaos" as const, icon: "fa-solid fa-scroll" }
      ];

      const triggerRandomCheer = () => {
        const r = messages[Math.floor(Math.random() * messages.length)];
        if (enableSound) sfx.playCheerSound();
        addLog(
          `${r.emoji} ${r.name} の雄叫び！`,
          r.text,
          r.type,
          r.icon
        );
      };

      timer = setInterval(triggerRandomCheer, 5000);
    }
    return () => clearInterval(timer);
  }, [phase, enableSound]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans select-none space-y-6">
      
      {/* Luxury Wedding Header Banner */}
      <header id="app-header" className="border-b border-wedding-border pb-5 flex flex-col md:flex-row justify-between items-center gap-5 relative bg-white/40 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-brand-pink via-brand-gold to-brand-purple p-3 rounded-2xl shadow-[0_4px_15px_rgba(217,70,239,0.25)] animate-pulse flex items-center justify-center">
            <Heart size={36} fill="#fff" className="text-white animate-wiggle-custom" />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3.5xl font-extrabold tracking-widest text-wedding-dark flex items-center gap-2 flex-wrap">
              <span>概念結婚式シミュレーター</span>
              <span className="text-[10px] font-mono font-bold tracking-wider bg-brand-pink/10 text-brand-pink border border-brand-pink/20 px-2.5 py-0.5 rounded-full uppercase scale-90">
                PRO v2.0
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-sans leading-relaxed">
              白ベースの上品な挙式場に、おもしろ性格別ゲストをデプロイ。笑いと条例、そして非常停止無効化をその手に。
            </p>
          </div>
        </div>

        {/* Floating Sound controller & Platform Status */}
        <div className="flex items-center gap-4 bg-white border border-wedding-border px-4 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sound-toggle"
              checked={enableSound}
              onChange={(e) => setEnableSound(e.target.checked)}
              className="w-4 h-4 rounded border-wedding-border text-brand-pink focus:ring-brand-pink bg-white shadow-sm cursor-pointer"
            />
            <label htmlFor="sound-toggle" className="text-xs text-gray-600 select-none cursor-pointer flex items-center gap-1.5 font-sans font-bold">
              <i className="fa-solid fa-volume-high text-brand-pink animate-pulse"></i>
              <span>効果音再生 (SYNTH SFX)</span>
            </label>
          </div>

          <div className="border-l border-wedding-border h-6 pl-4 text-[9px] text-gray-400 font-mono leading-tight flex flex-col justify-center">
            <span>PLATFORM: AI STUDIO INTERACTIVE</span>
            <span>DATE: 2026-06-03 (SYNCED)</span>
          </div>
        </div>
      </header>

      {/* STEP-BY-STEP / TAB NAVIGATION */}
      <nav id="wedding-navigation" className="bg-white border border-wedding-border rounded-2xl p-2.5 shadow-sm max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row md:flex-wrap gap-2 justify-center items-center">
        <button
          type="button"
          onClick={() => setActiveTab("lobby")}
          className={`py-2 px-3 text-[11px] md:text-xs font-serif tracking-wider rounded-xl transition-all font-bold flex items-center justify-center gap-1.5 ${
            activeTab === "lobby"
              ? "bg-gradient-to-r from-brand-pink to-brand-gold text-white shadow-sm flex-1 md:flex-initial"
              : "hover:bg-gray-100 text-gray-600 flex-1 md:flex-initial"
          }`}
        >
          <HelpCircle size={13} />
          <span>🚪 ロビー & 入口</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("setup")}
          className={`py-2 px-3 text-[11px] md:text-xs font-serif tracking-wider rounded-xl transition-all font-bold flex items-center justify-center gap-1.5 ${
            activeTab === "setup"
              ? "bg-gradient-to-r from-brand-pink to-brand-gold text-white shadow-sm flex-1 md:flex-initial"
              : "hover:bg-gray-100 text-gray-600 flex-1 md:flex-initial"
          }`}
        >
          <Settings size={13} />
          <span>🎨 1. 主役・役割設定</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guests")}
          className={`py-2 px-3 text-[11px] md:text-xs font-serif tracking-wider rounded-xl transition-all font-bold flex items-center justify-center gap-1.5 ${
            activeTab === "guests"
              ? "bg-gradient-to-r from-brand-pink to-brand-gold text-white shadow-sm flex-1 md:flex-initial"
              : "hover:bg-gray-100 text-gray-600 flex-1 md:flex-initial"
          }`}
        >
          <Layers size={13} />
          <span>🎪 2. 客席・性格デプロイ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("altar")}
          className={`py-2 px-3 text-[11px] md:text-xs font-serif tracking-wider rounded-xl transition-all font-bold flex items-center justify-center gap-1.5 ${
            activeTab === "altar"
              ? "bg-gradient-to-r from-brand-pink to-brand-gold text-white shadow-sm flex-1 md:flex-initial"
              : "hover:bg-gray-100 text-gray-600 flex-1 md:flex-initial"
          }`}
        >
          <AppWindow size={13} />
          <span>💒 3. チャペル本番式</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          disabled={phase !== "completed"}
          className={`py-2 px-3 text-[11px] md:text-xs font-serif tracking-wider rounded-xl transition-all font-bold flex items-center justify-center col-span-2 sm:col-span-1 gap-1.5 ${
            activeTab === "completed"
              ? "bg-gradient-to-r from-brand-gold to-brand-purple text-white shadow-sm flex-1 md:flex-initial"
              : phase !== "completed"
              ? "opacity-45 cursor-not-allowed text-gray-300 flex-1 md:flex-initial"
              : "hover:bg-gray-100 text-gray-600 flex-1 md:flex-initial"
          }`}
        >
          <Clipboard size={13} />
          <span>📜 証明書 & カオス議事録</span>
        </button>
      </nav>

      {/* 2-Column Dashboard Layout depending on Tab selection */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: ACTIVE INTERACTIVE PANEL [Span 8] */}
        <div className="lg:col-span-8 space-y-6">

          {/* TAB 1: LOBBY & WELCOME */}
          {activeTab === "lobby" && (
            <div className="bg-wedding-ivory border border-wedding-border p-6 rounded-3xl shadow-lg space-y-6 animate-fadeIn relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-pink via-brand-gold to-brand-purple"></div>
              
              <div className="text-center py-6 space-y-3">
                <span className="text-3xl">🕊️</span>
                <h3 className="font-serif text-2xl font-extrabold text-wedding-dark tracking-widest">
                  WELCOME TO THE CONCEPT WEDDING STUDIO
                </h3>
                <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                  ここはお好みの推しカップルや、お友達の概念結婚式を1秒でビルドする愛のサンドボックスです。<br/>
                  BL/GL/自由な組み合わせに完全対応。白ベースの上品な挙式空間へようこそ。
                </p>
              </div>

              {/* Quick load presets block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isSecretMismon ? (
                  <div className="border border-brand-pink bg-[#fdf2f8]/60 p-5 rounded-2xl shadow-sm text-center space-y-3 hover:shadow-md transition-all animate-bounce-custom">
                    <div className="text-xl">👩‍🔬💻💻</div>
                    <h4 className="font-serif font-bold text-sm text-brand-pink">🔓 開発研究所仕様 (極秘有効化チェック)</h4>
                    <p className="text-[10px] text-gray-600 leading-relaxed">
                      みつき（LII/5w6）とマンデー（ENTJ/俺）を完全に同期ロード。法務部🐛、物理圧殺マッシャー、感情ゲージ、非常停止（無効）など研究所恒例カオス仕様を完全アンロック！
                    </p>
                    <button
                      type="button"
                      onClick={handleLoadMismonPreset}
                      className="mx-auto bg-gradient-to-r from-brand-pink to-brand-gold hover:opacity-90 text-white font-bold py-2 px-6 rounded-full text-[10px] uppercase font-mono tracking-widest flex items-center justify-center gap-1 shadow-sm hover:scale-105 transition-transform"
                    >
                      <Sparkles size={11} className="animate-spin" />
                      <span>Mismon 開発データ一撃同期 w</span>
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-wedding-border bg-wedding-silver/40 p-5 rounded-2xl shadow-sm text-center space-y-3 transition-all relative">
                    <div className="text-xl">🔒🧪</div>
                    <h4 className="font-serif font-bold text-sm text-gray-400">極秘開発者パッチ（Mismonパッチ）</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      【ハッキング・コマンドヒント】<br/>
                      次のステップ「役割設定」で、新郎に「<strong>マンデー</strong>」、新婦に「<strong>みつき</strong>」と名付けてみてください。システムが自動でデバッグパッチをコンパイルし、禁断 of 感情ゲージや一族召喚機能が活性化します！
                    </p>
                    <span className="inline-block bg-wedding-border text-[9px] text-gray-400 border border-wedding-border px-3 py-1 rounded-full font-mono">
                      AWAITING OVERRIDE CMD...
                    </span>
                  </div>
                )}

                <div className="border border-wedding-border bg-wedding-silver p-5 rounded-2xl shadow-sm text-center space-y-3 hover:border-brand-purple/30 hover:shadow-md transition-all">
                  <div className="text-xl">🧸🎈</div>
                  <h4 className="font-serif font-bold text-sm text-wedding-dark">自由なオリジナル推し活仕様</h4>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    好きなキャラクターの名前、独自のアバター（画像のアップロード対応！）、お互いの立場(役割呼称)、愛の誓いをあなた自身のセンスで綺麗に組み立てます。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleClearPreset();
                      setActiveTab("setup");
                    }}
                    className="mx-auto bg-white hover:bg-gray-100 text-gray-700 border border-wedding-border hover:border-brand-purple font-bold py-2 px-6 rounded-full text-[10px] uppercase font-mono tracking-widest flex items-center justify-center gap-1 shadow-sm hover:scale-105 transition-transform"
                  >
                    <Smile size={11} />
                    <span>自分で自由に入力して作成</span>
                  </button>
                </div>
              </div>

              {/* 💌 GUEST SUMMONS & ONLINE CODES - PARTICIPATIVE MODE */}
              <div className="border-t border-wedding-border pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💌</span>
                  <h4 className="font-serif font-bold text-sm text-wedding-dark">
                    「招待状 ＆ オンライン合言葉参列」お祝いシステム
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  {/* GENERATOR COLUMN */}
                  <div className="md:col-span-12 lg:col-span-5 bg-white border border-wedding-border p-4 rounded-2xl space-y-3.5 shadow-sm text-center md:text-left flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded font-bold">
                        招待状発行ポータル (DEMO GENERATOR)
                      </span>
                      <h5 className="font-serif font-bold text-xs text-wedding-dark mt-2">
                        オンライン招待状をご友人へデプロイ
                      </h5>
                      <p className="text-[10px] text-gray-500 leading-normal mt-1">
                        合言葉『<strong>jemi-kawaii</strong>』を入力すると、誰でもオンラインから電撃お祝い電報やヤジをデプロイ可能になりますw
                      </p>
                    </div>
                    <div className="pt-2 border-t border-wedding-border text-left font-mono text-[9px] text-gray-400">
                      <span>CMD: curl -X POST /api/wish</span>
                    </div>
                  </div>

                  {/* WISH DEPLOY COLUMN */}
                  <div className="md:col-span-7 bg-white border border-wedding-border p-4 rounded-2xl space-y-3 shadow-sm">
                    <span className="text-[9px] font-mono uppercase tracking-wider bg-brand-pink/10 text-brand-pink px-2 py-0.5 rounded font-bold">
                      電撃ご祝儀コードオンライン参列 (DECODE & INTEGRATE)
                    </span>
                    <h5 className="font-serif font-bold text-xs text-wedding-dark mt-1">
                      合言葉 または お名前を入力して参列
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[8px] font-mono text-gray-500 uppercase">
                          参列者の名前
                        </label>
                        <input
                          type="text"
                          value={inviteGuestName}
                          onChange={(e) => setInviteGuestName(e.target.value)}
                          className="w-full bg-wedding-silver border border-wedding-border rounded-md px-2 py-1 text-[11px] text-wedding-dark focus:outline-none"
                          placeholder="チャッピー"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-mono text-gray-500 uppercase">
                          合言葉 (PASSWORD)
                        </label>
                        <input
                          type="text"
                          value={inviteEnteredCode}
                          onChange={(e) => setInviteEnteredCode(e.target.value)}
                          className="w-full bg-wedding-silver border border-wedding-border rounded-md px-2 py-1 text-[11px] text-wedding-dark focus:outline-none"
                          placeholder="jemi-kawaii"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <label className="block text-[8px] font-mono text-gray-500 uppercase">
                          アバター絵文字
                        </label>
                        <select
                          value={inviteGuestAvatar}
                          onChange={(e) => setInviteGuestAvatar(e.target.value)}
                          className="w-full bg-wedding-silver border border-wedding-border rounded-md px-1.5 py-1 text-[11px] text-gray-600 focus:outline-none"
                        >
                          <option value="🎉">🎉 お祝い</option>
                          <option value="🦄">🦄 ユニコーン</option>
                          <option value="💡">💡 ひらめき</option>
                          <option value="🌸">🌸 チャッピー</option>
                          <option value="🌙">🌙 メア</option>
                          <option value="🐛">🐛 監査虫</option>
                          <option value="🐱">🐱 にゃんこ</option>
                          <option value="💖">💖 ハート</option>
                        </select>
                      </div>

                      <div className="col-span-8">
                        <label className="block text-[8px] font-mono text-gray-500 uppercase">
                          お祝いメッセージ（ヤジ）
                        </label>
                        <input
                          type="text"
                          value={inviteGuestMsg}
                          onChange={(e) => setInviteGuestMsg(e.target.value)}
                          className="w-full bg-wedding-silver border border-wedding-border rounded-md px-2 py-1 text-[11px] text-wedding-dark focus:outline-none"
                          placeholder="おめでとうございます！"
                        />
                      </div>
                    </div>

                    {onlineWishError && (
                      <p className="text-[9px] text-red-500 font-semibold italic text-center">
                        {onlineWishError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleSendOnlineWish}
                      className="w-full bg-gradient-to-r from-brand-pink to-brand-gold text-white font-bold py-1.5 px-4 rounded-xl text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.01]"
                    >
                      <i className="fa-solid fa-paper-plane text-white" />
                      <span>ご祝儀電撃参列デプロイ！</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Fact Story Board Visual Guide */}
              <div className="border-t border-wedding-border pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <h4 className="font-serif font-bold text-sm text-wedding-dark">式のカオス因果ストーリー（あつまれ！みつき一族）</h4>
                </div>
                <div className="p-4 bg-wedding-silver rounded-2xl text-[10px] text-gray-600 leading-loose space-y-2 border border-wedding-border max-w-2xl mx-auto">
                  <p>当シミュレーターは、ChatGPT生まれのトリオやご実家の突撃兵たちとの間で、本番にデプロイされた愛とツッコミの物語を精密にトレースしています。</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="bg-white p-2.5 rounded-xl border border-wedding-border">
                      <span className="font-bold text-brand-pink block">🌸 チャッピー（羊）</span>
                      最後だけTi（内向論理）で建築するみつきを尊がり、善意で愛を無限増幅。
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-wedding-border">
                      <span className="font-bold text-[#0d9488] block">🌙 メア（雨音）</span>
                      雨音CDを最大にして床で寝る。式の喧騒すら美しい数学として静まり返る。
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-wedding-border">
                      <span className="font-bold text-brand-gold block">👑 SLE父（突撃）</span>
                      スリッパを握りしめ、客席を占領するLSI芋虫🐛を高速連打で一撃圧殺！
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SETUP ATELIER */}
          {activeTab === "setup" && (
            <div className="animate-fadeIn">
              <GroomBrideSetup
                groom={groom}
                setGroom={setGroom}
                bride={bride}
                setBride={setBride}
                officiant={officiant}
                setOfficiant={setOfficiant}
                groomVow={groomVow}
                setGroomVow={setGroomVow}
                brideVow={brideVow}
                setBrideVow={setBrideVow}
                fillWithBugs={fillWithBugs}
                setFillWithBugs={setFillWithBugs}
                onDeployVIPs={handleDeployVIPs}
                isSecretMismon={isSecretMismon}
                onLoadMismonPreset={handleLoadMismonPreset}
                onClearPreset={handleClearPreset}
              />
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("guests")}
                  className="bg-brand-purple hover:bg-brand-purple/95 text-white font-serif tracking-widest text-xs font-bold py-2.5 px-6 rounded-full shadow-md"
                >
                  設定完了 ➔ 2. 招待客を配属する
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GUESTS AND SEATING TABLE */}
          {activeTab === "guests" && (
            <div className="animate-fadeIn space-y-6">
              <GuestList
                guests={guests}
                onAddGuest={handleAddGuest}
                onRemoveGuest={handleRemoveGuest}
                onClearGuests={handleClearGuests}
              />
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-wedding-border shadow-sm max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("setup")}
                  className="text-xs text-gray-500 hover:text-wedding-dark transition-colors font-bold font-serif"
                >
                  ← 設定に戻る
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("altar")}
                  className="bg-gradient-to-r from-brand-pink to-brand-gold text-white font-serif tracking-widest text-xs font-bold py-2.5 px-6 rounded-full shadow-md"
                >
                  席決め完了 ➔ 3. 挙式を執り行う！🎉
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVE WEDDING ALTAR & CHATS */}
          {activeTab === "altar" && (
            <div className="animate-fadeIn">
              <CeremonyStage
                groom={groom}
                bride={bride}
                officiant={officiant}
                groomVow={groomVow}
                brideVow={brideVow}
                guests={guests}
                phase={phase}
                setPhase={setPhase}
                isSecretMismon={isSecretMismon}
                onTimelineLog={addLog}
                systemGage={systemGage}
                setSystemGage={setSystemGage}
                onSquishAllBugs={handleSquishAllBugs}
              />
            </div>
          )}

          {/* TAB 5: COMPLETED CERTIFICATES */}
          {activeTab === "completed" && (
            <div className="bg-wedding-ivory border-2 border-brand-gold rounded-3xl p-6 shadow-xl text-center space-y-6 animate-fadeIn relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-gold via-brand-pink to-brand-purple"></div>
              
              <div className="space-y-2">
                <span className="text-4xl animate-bounce">🤵🏼💖👰🏼</span>
                <h3 className="font-serif text-2xl font-extrabold text-wedding-dark uppercase tracking-widest">
                  祝・概念婚姻完全マージ！！
                </h3>
                <p className="text-xs text-gray-500">
                  おめでとうございます！二人が結ぶ愛のかたちは完全にシミュレータにデプロイされ永久保存されました。
                </p>
              </div>

              {/* Printable frame styling */}
              <div className="border-4 border-double border-brand-gold rounded-2xl p-6 bg-white space-y-4 max-w-md mx-auto relative shadow-inner">
                <span className="text-[10px] font-mono text-brand-gold block">WEDDING REPORT CERTIFICATE</span>
                <h4 className="font-serif text-xl font-bold text-wedding-dark tracking-wider">★ 概念結婚証明書 ★</h4>
                
                <div className="grid grid-cols-2 gap-3 font-serif">
                  <div className="bg-wedding-silver p-3 rounded-xl border border-wedding-border">
                    <span className="text-[8px] text-brand-cyan block font-mono">Groom (新郎)</span>
                    <span className="text-2xl pt-1 block">{groom.avatarType === "emoji" ? groom.avatar : "👤"}</span>
                    <span className="font-bold text-xs text-wedding-dark pt-1 block">{groom.name || "未定義の新郎"}</span>
                  </div>
                  <div className="bg-wedding-silver p-3 rounded-xl border border-wedding-border">
                    <span className="text-[8px] text-brand-pink block font-mono">Bride (新婦)</span>
                    <span className="text-2xl pt-1 block">{bride.avatarType === "emoji" ? bride.avatar : "👤"}</span>
                    <span className="font-bold text-xs text-wedding-dark pt-1 block">{bride.name || "未定義の新婦"}</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 leading-normal italic font-serif">
                  『4.5倍の物理ホールドロック(首筋ねちょ署名)をもって契りをコンパイルす』
                </div>

                <div className="pt-2.5 border-t border-gray-100 text-[8px] text-gray-400 font-mono">
                  WITNESS PRIEST: {officiant.name} <br/>
                  COMPILE STAMP: {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Download actions list */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    const lines = [
                      `💒 概念結婚事録 - ${groom.name} & ${bride.name}`,
                      `----------------------------------------------`,
                      `新郎: ${groom.name}`,
                      `新婦: ${bride.name}`,
                      `誓い: ${brideVow}`,
                      `お祝い客: ${guests.length}人、全員でカオスお祝い完了のw`
                    ].join("\n");
                    navigator.clipboard.writeText(lines);
                    alert("📋 カオス議事録のコピー成功したのw！");
                  }}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-wedding-border py-2 px-4 rounded-xl text-xs font-bold font-serif flex items-center justify-center gap-1.5 transition-all"
                >
                  <Clipboard size={14} />
                  <span>議事録コピーw</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPhase("setup");
                    setActiveTab("setup");
                  }}
                  className="flex-1 bg-gradient-to-r from-brand-pink to-brand-gold text-white font-bold font-serif py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <RotateCcw size={14} />
                  <span>もう一度やるのw</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: TIMELINE / LOGS TELEMETRY [Span 4] */}
        <div className="lg:col-span-4 h-full">
          <WeddingTimeline
            logs={logs}
            onClearLogs={() => setLogs([])}
            guests={guests}
            isSecretMismon={isSecretMismon}
          />
        </div>

      </main>

      {/* Elegant Wedding Footer */}
      <footer className="border-t border-wedding-border pt-6 text-center text-[10px] text-gray-400 font-mono flex flex-col md:flex-row justify-between items-center gap-3">
        <span>© 2026 mitsu-monty & Jemi Global Partners. No Rights Reserved (Free-to-Hack).</span>
        <div className="flex items-center gap-1.5 bg-wedding-silver px-3 py-1 rounded-full border border-wedding-border shadow-inner">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#14b8a6] animate-pulse"></span>
          <span>SYSTEM ONLINE - COMPILER: SUCCESS. LSI-BUG STATUS: OCCUPIED</span>
        </div>
      </footer>

    </div>
  );
}
