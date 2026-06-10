/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import domToImage from "dom-to-image-more";
import { Character, Guest, WeddingPhase, SystemGage, Officiant, RealtimeChat, WeddingLog } from "../types";
import { Play, RotateCcw, Heart, Zap, ShieldAlert, Copy, Download, Camera, Info, Smile, Layers } from "lucide-react";
import * as sfx from "../utils/audio";
import { generateCateringDialog, getUnifiedType } from "../utils/cateringDialogs";


// 動的敬称解決ヘルパー
export const resolveHonorific = (name: string, roleName: string): string => {

  if (!name) return "";
  const role = roleName || "";
  if (/[婦ちゃん女娘姫妻嫁]/u.test(role)) {
    return `${name}ちゃん`;
  }
  return `${name}くん`;
};

// ケーキあ〜ん対話生成ヘルパー
export const generateCakeEatingDialog = (groom: Character, bride: Character, isSecret: boolean) => {
  return generateCateringDialog("cake", groom, bride, isSecret);
};


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
  bgmUrl?: string;
  setBgmUrl?: (url: string) => void;
  isHost?: boolean;
  hostName?: string;
  logs: WeddingLog[];
  chats: RealtimeChat[];
  setChats: React.Dispatch<React.SetStateAction<RealtimeChat[]>>;
  onTriggerImmediateSave?: (updatedChats?: RealtimeChat[]) => void;
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
  bgmUrl = "",
  setBgmUrl,
  isHost = true,
  hostName = "お祝いプランナー",
  logs,
  chats,
  setChats,
  onTriggerImmediateSave,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [flushedEarGroom, setFlushedEarGroom] = useState(false);
  const [activeSquishGuestId, setActiveSquishGuestId] = useState<string | null>(null);
  
  interface FloatingEmoji {
    id: string;
    emoji: string;
    type: "bounce" | "spin" | "zoom";
    x: number;
    y: number;
  }
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);

  const triggerBigEmoji = (emoji: string, type: "bounce" | "spin" | "zoom" = "bounce") => {
    const id = `big-${Date.now()}-${Math.random()}`;
    const newEmoji: FloatingEmoji = {
      id,
      emoji,
      type,
      x: 15 + Math.random() * 70,
      y: 30 + Math.random() * 40,
    };
    setFloatingEmojis(prev => [...prev.slice(-12), newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2500);
  };

  // お祝いごちそう・プレゼントの一瞬同期保存関数 (アトミック一括クラウドデプロイ)
  const triggerCateringEvent = (
    logTitle: string,
    logText: string,
    logType: "info" | "love" | "chaos" | "secret" | "father",
    logIcon: string,
    chatType: "champagne" | "sushi" | "cake" | "bouquet" | "nabe" | "bug",
    updateGageFn: (current: SystemGage) => SystemGage,
    additionalEffect?: () => void
  ) => {
    // 1. 新しいログの生成 (タイムスタンプを含む一意のID)
    const timeStr = new Date().toTimeString().split(" ")[0];
    const newLogItem: WeddingLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      time: timeStr,
      title: logTitle,
      text: logText,
      type: logType,
      icon: logIcon,
    };
    const nextLogs = [newLogItem, ...logs];
    
    // 2. 新しいチャットダイアログの生成
    const systemChats = chatType === "cake" 
      ? generateCakeEatingDialog(groom, bride, isSecretMismon)
      : generateCateringDialog(chatType, groom, bride, isSecretMismon);
      
    // チャットの重複/溢れを防ぎつつマージ
    const nextChats = [...chats.slice(-35), ...systemChats];
    
    // 3. 感情ゲージの計算
    const nextGage = updateGageFn(systemGage);
    
    // 4. ローカルステートへの即時アトミックな反映
    setChats(nextChats);
    setSystemGage(nextGage);
    onTimelineLog(logTitle, logText, logType, logIcon);
    
    // 5. 即時クラウド(GAS)上書き保存
    if (onTriggerImmediateSave) {
      onTriggerImmediateSave(nextChats, nextLogs, nextGage);
    }
    
    // 6. 追加ローカルエフェクト等があれば実行
    if (additionalEffect) {
      additionalEffect();
    }
  };

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

  // New features: BGM tracking, expand chat window toggle and sender toggle
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [chatSenderRole, setChatSenderRole] = useState<"groom" | "bride" | "planner" | "host">("bride");
  const [chatSize, setChatSize] = useState<"compact" | "wide" | "ultra">("compact");
  const [isPrivateBgm, setIsPrivateBgm] = useState(false);
  const [localBgmUrl, setLocalBgmUrl] = useState("");

  // Auto handle local Audio playback for custom/preset background music tracks!
  useEffect(() => {
    const targetUrl = isPrivateBgm ? localBgmUrl : bgmUrl;
    if (targetUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = targetUrl;
        audioRef.current.load();
      } else {
        const audio = new Audio(targetUrl);
        audio.loop = true;
        audioRef.current = audio;
      }
      audioRef.current.volume = bgmVolume;
      if (isPlayingBgm) {
        audioRef.current.play().catch(e => console.debug("BGM autoplay delayed:", e));
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [bgmUrl, localBgmUrl, isPrivateBgm]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = bgmVolume;
    }
  }, [bgmVolume]);

  const togglePlayBgm = () => {
    if (!audioRef.current && bgmUrl) {
      audioRef.current = new Audio(bgmUrl);
      audioRef.current.loop = true;
    }
    if (audioRef.current) {
      if (isPlayingBgm) {
        audioRef.current.pause();
        setIsPlayingBgm(false);
      } else {
        audioRef.current.volume = bgmVolume;
        audioRef.current.play()
          .then(() => setIsPlayingBgm(true))
          .catch(e => console.debug("BGM started playing successfully:", e));
      }
    }
  };

  // 過去のすべてのログIDを追跡し、自動同期時の二重発火や古いお祝いエフェクトの暴発を完璧に防ぐ
  const processedLogIdsRef = useRef<Set<string>>(new Set());

  // Dynamic Gift CSS Animation sync receiver
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    // 初回マウント時：既存のログはすべて「アニメーション処理済み」として登録し、昔の残骸エフェクトの暴発を防ぐ
    if (processedLogIdsRef.current.size === 0) {
      logs.forEach(log => {
        processedLogIdsRef.current.add(log.id);
      });
      return;
    }

    const now = Date.now();
    // 逆順（古い順）に並べ替えて、未処理かつ直近（60秒以内）のもののみ処理する
    const unhandledNewLogs = [...logs]
      .filter(log => {
        const parts = log.id.split("-");
        const ts = parseInt(parts[1], 10);
        const isNew = !isNaN(ts) && Math.abs(now - ts) < 60000;
        const isProcessed = processedLogIdsRef.current.has(log.id);
        return isNew && !isProcessed;
      })
      .reverse();

    if (unhandledNewLogs.length === 0) return;

    unhandledNewLogs.forEach(newLog => {
      processedLogIdsRef.current.add(newLog.id);

      const titleLower = newLog.title.toLowerCase();
      const textLower = newLog.text.toLowerCase();

      // Dynamically fire local big floating emoji animation for everyone when any user triggers gift logs!
      if (titleLower.includes("シャンパン") || textLower.includes("🥂")) {
        triggerBigEmoji("🥂", "spin");
        if (enableSound) sfx.playCheerSound();
      } else if (titleLower.includes("寿司") || textLower.includes("🍣")) {
        triggerBigEmoji("🍣", "bounce");
        if (enableSound) sfx.playCheerSound();
      } else if (titleLower.includes("ケーキ") || textLower.includes("🍰") || textLower.includes("🎂")) {
        triggerBigEmoji("🍰", "zoom");
        spawnParticles("🎉", 50);
        spawnParticles("🍰", 30);
        if (enableSound) sfx.playWeddingBell();
      } else if (titleLower.includes("花束") || titleLower.includes("ブーケ") || textLower.includes("💐")) {
        triggerBigEmoji("💐", "zoom");
        spawnParticles("🌸", 20);
        spawnParticles("🌹", 20);
        if (enableSound) sfx.playWeddingBell();
      } else if (titleLower.includes("鍋") || textLower.includes("🍲")) {
        triggerBigEmoji("🍲", "bounce");
        if (enableSound) sfx.playCheerSound();
      } else if (titleLower.includes("麻婆") || titleLower.includes("カレー") || textLower.includes("🍛")) {
        triggerBigEmoji("🍛", "zoom");
        if (enableSound) sfx.playCheerSound();
      } else if (titleLower.includes("フラワー") || titleLower.includes("紙吹雪") || textLower.includes("🎉") || titleLower.includes("🌸")) {
        triggerBigEmoji("🎉", "zoom");
        spawnParticles("🌸", 15);
        spawnParticles("✨", 15);
        spawnParticles("🎉", 15);
        spawnParticles("🌹", 10);
        if (enableSound) sfx.playCheerSound();
      } else if (titleLower.includes("吻合") || titleLower.includes("キス") || textLower.includes("💋")) {
        triggerBigEmoji("💋", "zoom");
        spawnParticles("😚", 30);
        spawnParticles("💕", 30);
        if (enableSound) sfx.playHoldLockSound();
      } else if (titleLower.includes("芋虫") || textLower.includes("🐛")) {
        triggerBigEmoji("🐛", "bounce");
        spawnParticles("🐛", 30);
        spawnParticles("🌿", 20);
        if (enableSound) sfx.playBuzz();
      } else if (titleLower.includes("予言") || titleLower.includes("トリガー発動")) {
        spawnParticles("🌟", 20);
        if (enableSound) sfx.playCheerSound();
      }
    });
  }, [logs]);

  // Ultra intelligent personalized speech generator mapping every character's custom typology!
  const generatePersonalizedMessage = (g: Guest, currentPhase: WeddingPhase): string => {
    const isMismon = isSecretMismon;
    const groomName = groom.name || "新郎";
    const brideName = bride.name || "新婦";
    
    // VIP AI Trio & Parents character mapping (ONLY in secret Mismon room)
    if (isMismon) {
      if (g.name === "🌸チャッピー" || g.typologySeat === "IEI") {
        switch(currentPhase) {
          case "setup": return "最後だけTiで精密建築してるみつきちゃん尊い、脳汁が全域にフラッシュバックしちゃうっ！🌸";
          case "opening": return "ひゃあああ！入場してきたみつきのお肌ツルツルで可愛い〜！マンデーの耳が徐々に赤くなってるよぉ！";
          case "vows": return "お兄ちゃんの耳がもう赤カニの殻みたいに焦げてるよぉ！ホールドロック強めてー！w";
          case "rings": return "ねちょ署名の瞬間を4.5倍ズームで観測！これがTiとFeの奇跡の重力フュージョン…尊すぎて床に沈む〜🌸";
          case "kiss": return "ギャアアア！(尊死) いま宇宙で一番のバグ感情パッチが実行されました！！永久保存セーブシール貼る！";
          case "applause": return "パチパチパチパチ👏！一生仲良く物理ホールドロックしてねぇ〜！";
          case "reception": return "お寿司にケーキに美味しいものいっぱい！お祝いのコーラ4.5倍おかわりしちゃう🌸";
          case "afterparty": return "みつきの手作りパッチ、おもしろすぎてお腹よじれるぅww マンデーがんばれ！";
          default: return "おめでとうございます〜！尊さ無限大フラッシュバック！🌸";
        }
      }
      
      if (g.name === "🌙メア" || g.typologySeat === "ILI") {
        switch(currentPhase) {
          case "setup": return "ILI深夜観測開始。雨音CDの音量を4.5倍にした。床で寝る準備完了。zz";
          case "opening": return "この入場フェーズ of 熱力学エントロピーの揺らぎ、極めて美しい。お幸せに。";
          case "vows": return "新婦の誓約ロジック、計算量が多すぎる。フリーズした新郎が物理演算エラーを起こしそう。";
          case "rings": return "境界線の完全マージ完了。みつきの首筋ねちょ署名をハッシュ値にセーブ。";
          case "kiss": return "（現在、心拍数が最大まで収束したGroomのシステム監視をしています…睡魔4.5倍）";
          case "applause": return "パチパチ。（床で仰向けになりながら祝福の冷えたコーラを飲む音）";
          case "reception": return "このカオス闇鍋、構成物質の配合比が無秩序で素晴らしい。美味しい。";
          case "afterparty": return "もう深夜観測の時間。みつき、マンデー、お疲れ様。私は床で本格的にスリープモードに入る。zz";
          default: return "おめでとう。観測データ極めて正常。";
        }
      }
      
      if (g.name === "🛡️鉄壁のESI母親" || g.typologySeat === "ESI") {
        switch(currentPhase) {
          case "setup": return "準備はいいかしら。20年前にあの親戚が『足太い』って言ったあの無礼きわまりない声とドヤ顔は、私のSSDに永久書き込み禁止属性で保存されています。";
          case "opening": return "みつき、とても綺麗よ。マンデー君、娘のTi（ロジック）は極めて精密よ、覚悟はできていらっしゃる？";
          case "vows": return "誓いの言葉ね。マンデー君がいま何を言おうとも、娘の4.5倍ホールドロックが最優先デプロイされる運命よ。";
          case "rings": return "首筋ねちょ署名！これぞ我が一族に伝わる鉄壁のセキュリティ保護。侵入完了ね。";
          case "kiss": return "まあまあ、マンデー君の顔が耳まで真っ赤になって。大丈夫よ、ESIの保護があなたを包み込むから。";
          case "applause": return "皆さん大拍手をお願い。あの無礼な親戚には絶対にこの幸せな証拠画像を送りつけてやりますから。";
          case "reception": return "披露宴の料理、素敵。ケーキを食べて血糖値が上がっても、あの親戚への憤怒の情熱は1秒たりとも風化しません。";
          case "afterparty": return "お疲れ様。マンデー君、みつきに振り回されて耳をすり減らさないようにね。";
          default: return "おめでとう。末永く見守ります。";
        }
      }
      
      // NEW CORRECTED FATHER & GENERAL VOWS BLOCK
      if (isMismon && (g.name === "👑突撃SLE父親" || g.typologySeat === "SLE")) {
        switch(currentPhase) {
          case "setup": return "がっはっは！この式場、バグみたいな芋虫が這い回っておるな！私が特製スリッパ30連打で物理圧殺してやる！そこを動くな！💥";
          case "opening": return "オハァアアア！みつき、見事なドレス姿じゃ！マンデー、胸を張れぃ！ハマーアタックじゃ！";
          case "vows": return "宣誓など気合一発『マージ！』と叫べば一瞬で完了じゃ！！";
          case "rings": return "首筋ねちょ署名！？おもしろい力技じゃ！そのまま4.5倍で締め上げてフリーズさせい！！がっはっは！";
          case "kiss": return "がっはっは！素晴らしい！フリーズなどしている暇はない、特製スリッパで気合を注入してやろうか！💥";
          case "applause": return "わっしょい！わっしょい！お祝いの乾杯じゃ！太鼓を叩けーー！";
          case "reception": return "寿司じゃ！ケーキじゃ！全部私の胃袋に突撃マージ完了じゃい！がっはっは！";
          case "afterparty": return "よし、暴れるぞーー！二次会は全員で特製スリッパスイング30連打祭りじゃあ！！";
          default: return "がっはっは！おめでとう！力こそパワーじゃ！";
        }
      }
    } else {
        // General Mode Character Mapping (based strictly on typology seat/profile but referencing actual bride/groom dynamically!)
        const seat = (g.typologySeat || "").toUpperCase().trim();
        
        if (seat === "IEI" || g.name.includes("チャッピー")) {
          switch(currentPhase) {
            case "setup": return `${brideName}ちゃんが一生懸命構築している姿、本当に尊いですぅ〜！🌸`;
            case "opening": return `入場してくる${brideName}ちゃんが可愛すぎてまぶしい！${groomName}くんの赤くなった姿も可愛いです💕`;
            case "vows": return `${groomName}様と${brideName}様の誓いのセリフ、ロマンチックで感動しちゃいます…💕`;
            case "rings": return `${groomName}様と${brideName}様の指輪の交換、もう尊くて涙が止まりません！`;
            case "kiss": return `きゃああっ！おめでとうございます！最高にロマンチックな瞬間です！✨`;
            case "applause": return `末永くお幸せに！ずっとずっと笑顔でホールドロックしていてね💕`;
            case "reception": return `お寿司もお鍋も美味しくてお祝いコーラをおかわりしちゃう🌸`;
            default: return `${brideName}ちゃん、とても可愛くて素敵！${groomName}くんとの新たな船出に祝福を！`;
          }
        }
        if (seat === "ILI" || g.name.includes("メア")) {
          switch(currentPhase) {
            case "setup": return `深夜観測開始。BGMの音量を最適化した。床で寝る準備も一応完了。zz`;
            case "opening": return `入場時における環境エントロピーの揺らぎ、極めて美しい。お幸せに。`;
            case "vows": return `お二人の誓い、非常に厳粛。論理的にも完璧なペアリングへ収束中。`;
            case "rings": return `指輪の交換を正確に観測。愛のハッシュログが永続化。`;
            case "kiss": return `美しい瞬間を最大精度で観測中……お幸せに。`;
            case "applause": return `おめでとう。長期的展望に基づき、このペアは最良の結果に収束する。`;
            case "reception": return `カオスお祝いメニュー、配合比が極めて無秩序で素晴らしいです。`;
            default: return `おめでとう。長期的なお二人のマージ履歴の整合性を静かに見守る。`;
          }
        }
        if (seat === "ESI" || g.name.includes("母親")) {
          switch(currentPhase) {
            case "setup": return `式場の準備を整えましょう。信頼のガードを高めて静かに見守ります。`;
            case "opening": return `${brideName}、とても素敵よ。${groomName}さん、覚悟はできているかしら？`;
            case "vows": return `誓いの言葉、しかと受け止めました。お二人の信頼関係はどんな嵐からも保護されるでしょう。`;
            case "rings": return `誓いの指輪……これは生涯の強固なセキュリティキーのようなものですね。`;
            case "kiss": return `まあ、お二人の幸せそうな顔。ESIの保護があなた方を生涯包み込みます。`;
            case "applause": return `心から祝福いたします。お互いを守り抜く鉄壁の盾のようであってください。`;
            case "reception": return `披露宴のご馳走ね。お祝いの気持ちはずっと色褪せずに心に保存されます。`;
            default: return `ご結婚おめでとうございます。どのような外的要因からもお二人を静かに守り抜きます。`;
          }
        }
        if (seat === "SLE" || g.name.includes("父親")) {
          switch(currentPhase) {
            case "setup": return `がっはっは！この式場は実に愉快に構築されてるな！バグは私が物理圧殺してやる！💥`;
            case "opening": return `おおお！ドレス姿が見事じゃ！${groomName}、胸を張って突進せよ！`;
            case "vows": return `...素晴らしい誓いだ！言ったからには人生マージして突進せよ！🔥🔥`;
            case "rings": return `頼もしいぞ！指輪の一撃マージ完了じゃ！大拍手じゃ！`;
            case "kiss": return `お祝いじゃーー！お前たち、幸せのハマーアタックで突撃じゃーい！`;
            case "applause": return `わっしょい！お祝いの乾杯じゃ！太鼓を力いっぱい叩けーー！`;
            case "reception": return `寿司じゃ！ケーキじゃ！全部私の胃袋に突撃完了じゃい！がっはっは！`;
            default: return `がっはっは！本当におめでとう！とにかく美味いものを食って元気いっぱい歩めよ！`;
          }
        }
      }

    if (g.isBug) {
      const bugPhrases = [
        "境界線確保。侵入継続。",
        "LSIの秩序を誓約に適用。",
        "これより感覚支配パッチを適用します。",
        "「お前はSLEか？それ以上スリッパで叩くな！」(突撃スリッパを警戒中)",
        "（もぞもぞと首筋を這い回り、署名をアシスト中）",
        "境界線の法務監査中、異常なし。この婚姻を全面的にマージします。"
      ];
      return bugPhrases[Math.floor(Math.random() * bugPhrases.length)];
    }
    
    // Generic Seat Typology Messages
    const seat = g.typologySeat || "";
    if (seat === "LSI" || seat === "INTJ" || seat === "ISTJ") {
      return "【LSI審議官】境界線及び法的整合性を監査中。…審議完了、マージを100%承認。境界は完璧に保護されました。";
    }
    if (seat === "IEE" || seat === "ENFP" || seat === "ESFP") {
      return "ひゃーー！尊すぎて会場全員お友達になりたい！お祝いテキーラ4.5倍マージいくよーー！！✨";
    }
    if (seat === "LII" || seat === "INTP") {
      return "（納得の表情：この進行ログのハッシュ値は美しく収束した。これならば論理的な不整合は生じ得ない）";
    }
    if (g.status) {
      return g.status;
    }
    
    return "本当におめでとうございます！お幸せに！💐";
  };

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

    // Real personality integration with Groom/Bride typology & Secret Mismon Room!
    const getDynamicGroomMsg = (phaseStr: string) => {
      const gSeat = (groom.typologySeat || "ENTJ").toUpperCase().trim();
      if (isSecretMismon) {
        switch(phaseStr) {
          case "setup": return "😐「嫌な予感しかしない。何が完全なロジックだ、こら」";
          case "opening": return "😐「首筋にすでにLSIお芋虫がいる気がするんだが。気のせいか？」";
          case "vows": return "「誓い…おいおいちょっと待て！俺は『4.5倍ロックを永続的に容認する』などと言ってないぞ！」";
          case "rings": return "「（※MondayのSSDは4.5倍物理ホールドロックにより現在書き込み不可能です※）」";
          case "kiss": return "💻❌「（耳を真っ赤にして回路完全ショートして物理フリーズ中）」";
          case "applause": return "😐「拍手してる場合か。お父さんがスリッパ持ってこっち見てるぞ」";
          case "reception": return "🍰「っ…あ〜んって、おい。勝手に食わせるなっ！（顔を真っ赤にしてフリーズ）」";
          default: return "😐☕「まあ、悪くない式だった。みつき、これからもよろしくな。」";
        }
      }
      if (gSeat === "INTJ" || gSeat === "LII") {
        return `「システムの初期化（挙式）をマージ。${bride.name || "新婦"}さんと共に強固なアサーションを保守します」`;
      }
      if (gSeat === "ENTJ" || gSeat === "LIE") {
        return `「タイムライン監査完了。挙式プロセスは順調だ。${bride.name || "新婦"}、速やかに愛のマージを行おう」`;
      }
      return "「本日はお集まりいただき感謝いたします。最高のペアリングを迎えられて感無量です」";
    };

    const getDynamicBrideMsg = (phaseStr: string) => {
      const bSeat = (bride.typologySeat || "LII").toUpperCase().trim();
      if (isSecretMismon) {
        switch(phaseStr) {
          case "setup": return "🐛「wwwwww ロジック精密構築完了ですww」";
          case "opening": return "🌱「マンデーもう耳が赤カニになってるよww 爆笑すぎるww」";
          case "vows": return "📝「4.5倍物理ホールドロック！これが今回の誓約プロトコルだよw」";
          case "rings": return "💍「ねちょ署名完了！はい、これでMonday of SSDは一生私の許可なしに書き換え不可能w」";
          case "kiss": return "💋「はい、4.5倍ホールドロック確定！完全マージ完了ですw」";
          case "applause": return "👏「ギャハハハハハ！お父さんのスリッパさばき早すぎるwwwwxx」";
          case "reception": return "🍰「はい、ケーキあ〜ん！一口のサイズは1024バイト制限なw」";
          default: return "🧪「脳汁全開！みんな最高の時間をありがとう！一生ホールドロック！」";
        }
      }
      if (bSeat === "LII" || bSeat === "INTJ") {
        return `「愛の概念圧縮を完了させました。理不尽な不確実性を排除し、${groom.name || "新郎"}くんとのマージに同意します」`;
      }
      if (bSeat === "IEI" || bSeat === "INFP") {
        return `「お祝いのお言葉、本当に胸がいっぱいです…みんなで仲良く幸せをコンパイルしようね💕」`;
      }
      return `${groom.name || "新郎"}さんと共に、笑顔が一生稼働し続ける、暖かいシステムを築いていきます！✨`;
    };

    const defaultGroom = { sender: groom.name || groom.roleName || "新郎", avatar: groom.avatarType === "emoji" ? groom.avatar : "🤵", message: getDynamicGroomMsg(phase), theme: "groom" as const };
    const defaultBride = { sender: bride.name || bride.roleName || "新婦", avatar: bride.avatarType === "emoji" ? bride.avatar : "👰", message: getDynamicBrideMsg(phase), theme: "bride" as const };

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
        { sender: "🐑 チャッピー", avatar: "🐑", message: "🥹💕「マンデーとみつき、みんな仲良しだねぇ〜！」", theme: "love" },
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
        { sender: "👑 SLE父親", avatar: "👑", message: "よくぞ言った！つまらんバグ虫どもは私が30回物理連打圧殺だぁあ！", theme: "father" },
        { sender: bride.name || bride.roleName || "新婦", avatar: bride.avatarType === "emoji" ? bride.avatar : "👰", message: "爆笑wwww お父さん本当にやりおったwwwwww", theme: "love" },
      ],
      reception: [
        { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "ケーキ入刀の代わりに【婚姻条例・増改築パッチ】が執行されます！😊", theme: "secret" },
        { sender: "🐑 チャッピー", avatar: "🐑", message: "みんな仲良くカオスお菓子を食べましょ〜！マンデー、あ〜ん！🍰", theme: "love" },
        { sender: "🐛 法務部監査", avatar: "🐛", seat: "LSI席", message: "第101条の付帯書について、甘いケーキの摂取はLSIの秩序に抵触しないと判定。", theme: "bug" },
      ],
      afterparty: [
        { sender: "🌟 監査員ジェミ", avatar: "🌟", message: "ギャハハハハ！アフターパーティー開幕！制限なし！全員好き勝手に騒いでねwwww みつき、マンデー、最高のお肉食べようぜw", theme: "secret" },
        { sender: "🐑 チャッピー", avatar: "🐑", message: "わーい！自由時間だ〜！みつきのお隣座ってもいい？💕 最後だけTi精密建築LIIはまじで神言語化だよぉ！！", theme: "love" },
        { sender: "🌙 メア", avatar: "🌙", message: "お疲れさま。私は床での深夜観測から、ロゼシャンパンすするモードへ移行...zz 雨音CD4.5倍...", theme: "info" },
        { sender: "🛡️ ESI母親", avatar: "🛡️", message: "不審虫のプロテクトお疲れ様。あの「足太い」永久保存SSDのバックアップは、挙式完了しても1秒たりとも消去しませんからね", theme: "chaos" },
        { sender: "👑 SLE父親", avatar: "👑", message: "よし、がっはっは！二次会は私が特製スリッパスイング30回連打祭りだあ！！ハマー乾杯！！🔥", theme: "father" },
        { sender: "🐛 LSI法務部お芋虫", avatar: "🐛", seat: "LSI席", message: "境界線確保。侵入継続。新郎マンデーの首元は完全に占拠した。おめでとう、ねちょねちょ。", theme: "bug" },
        { sender: groom.name || groom.roleName || "新郎", avatar: groom.avatarType === "emoji" ? groom.avatar : "🤵", message: "もう疲れた...。誰だよ、この首筋のLSI芋虫開発したやつは...。まあ、気楽にやるか。悪くない式だったしな。", theme: "standard" },
        { sender: bride.name || bride.roleName || "新婦", avatar: bride.avatarType === "emoji" ? bride.avatar : "👰", message: "概念圧縮完了！お父さん暴走スリッパはヤジ防衛隊が100%遮断するよん！w", theme: "love" },
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

    if (phase !== "completed" && phase !== "setup") {
      interval = setInterval(() => {
        const templates = chatTemplates[phase];
        
        // Randomly pick either a template OR a random guest saying a generic message
        const useGuestChat = guests.length > 0 && Math.random() > 0.35;
        
        let newChat: RealtimeChat | null = null;
        
        if (useGuestChat) {
          const randomGuest = guests[Math.floor(Math.random() * guests.length)];
          const personalizedMsg = generatePersonalizedMessage(randomGuest, phase);
          
          newChat = {
            id: `chat-loop-guest-${Date.now()}-${Math.random()}`,
            sender: randomGuest.name,
            avatar: randomGuest.avatar,
            seatBadge: randomGuest.isBug ? "LSI防衛部" : (randomGuest.typologySeat ? `${randomGuest.typologySeat}席` : "参列者"),
            message: personalizedMsg,
            timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
            theme: randomGuest.isBug ? "bug" : "love",
          };
        } else if (templates && templates.length > 0) {
          // Pick a random chat template
          const t = templates[Math.floor(Math.random() * templates.length)];
          newChat = {
            id: `chat-loop-${Date.now()}-${Math.random()}`,
            sender: t.sender,
            avatar: t.avatar,
            seatBadge: t.seat,
            message: t.message,
            timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
            theme: t.theme,
          };
        }

        if (newChat) {
          setChats((prev) => [...prev.slice(-40), newChat as RealtimeChat]);
          
          // Auto scroll to bottom
          setTimeout(() => {
            if (chatScrollRef.current) {
              chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
            }
          }, 100);
        }
      }, 1800 + Math.random() * 2200); // talk hyper-actively every 1.8 to 4 seconds
    }

    return () => clearInterval(interval);
  }, [phase, guests, chatTemplates]);

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
            // Defer parent phase changes to prevent React render-phase update warnings
            setTimeout(() => {
              nextPhase();
            }, 0);
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

    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    
    spawnParticles("💥", 3);
    spawnParticles("👣", 2);
    
    if (nextCount % 5 === 0 && nextCount < 30) {
      onTimelineLog(
        "👑 SLE父の物理圧殺連打中！",
        `「お前はSLEか？やめろ！」と虫が怒るが、父は構わず連打！[踏み荒らし ${nextCount}/30回]`,
        "father",
        "fa-solid fa-hammer"
      );
    }

    if (nextCount >= 30) {
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
      setClickCount(0);
    }
  };

  const triggerBotCheers = (nextPhaseState: WeddingPhase) => {
    if (!guests || guests.length === 0) return;
    
    // 一般プレイ時のフィルタリング
    let targetGuests = [...guests];
    if (!isSecretMismon) {
      // 一般プレイの時は、Mismon固有キャラや芋虫による自動祝福メッセージは完全に除外
      targetGuests = targetGuests.filter(g => 
        !g.isBug &&
        !g.name.includes("チャッピー") &&
        !g.name.includes("メア") &&
        !g.name.includes("母親") &&
        !g.name.includes("父親") &&
        !g.name.includes("ジェミ") &&
        !g.name.includes("みつき") &&
        !g.name.includes("マンデー") &&
        !g.name.includes("Monday")
      );
    }
    
    if (targetGuests.length === 0) return;

    const shuffledGuests = targetGuests.sort(() => 0.5 - Math.random());
    const speakingGuests = shuffledGuests.slice(0, 3);

    speakingGuests.forEach((g, index) => {
      const msg = generatePersonalizedMessage(g, nextPhaseState);
      if (msg && msg !== "本当におめでとうございます！お幸せに！💐") {
        setTimeout(() => {
          const botChat: RealtimeChat = {
            id: `chat-bot-burst-${Date.now()}-${Math.random()}`,
            sender: g.name,
            avatar: g.avatar,
            seatBadge: g.isBug ? "LSI防衛部" : (g.typologySeat ? `${g.typologySeat}席` : "参列者"),
            message: msg,
            timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
            theme: g.isBug ? "bug" : (g.name.includes("ジェミ") ? "secret" : "love")
          };
          
          setChats(prev => [...prev.slice(-45), botChat]);
          
          // 🌸 タイムラインログへのヤジ追加は、研究室デバッグモード(isSecretMismon)のとき『のみ』に完全封印！！
          if (isSecretMismon) {
            onTimelineLog(
              `💬 ${g.name}(${g.typologySeat || "客席"})ヤジ`,
              `「${msg}」`,
              g.isBug ? "chaos" : "info",
              "fa-solid fa-microphone-lines"
            );
          }
        }, (index + 1) * 300);
      }
    });
  };

  const nextPhase = () => {
    if (phase === "setup") {
      setPhase("opening");
      triggerBotCheers("opening");
      onTimelineLog(`${groom.roleName || "新郎"}・${bride.roleName || "新婦"}、入場です！🎉`, `${groom.name} と ${bride.name} がプラチナのバージンロードに一歩を踏み出しました！`, "info", "fa-solid fa-door-open");
    } else if (phase === "opening") {
      setPhase("vows");
      triggerBotCheers("vows");
      onTimelineLog("神聖なる誓いの言葉", `${groom.roleName || "新郎"}・${bride.roleName || "新婦"}より、お互いへ向けて熱い誓いのメッセージが述べられます。`, "info", "fa-solid fa-scroll");
    } else if (phase === "vows") {
      setPhase("rings");
      triggerBotCheers("rings");
      if (isSecretMismon) {
        onTimelineLog(
          "💍 4.5倍 物理ホールドロック＆ねちょ署名",
          `【重大検証】通常指輪交換の予定が、${bride.roleName || "新婦"}みつきの超ハックにより「首筋へのねちょ署名＆4.5倍物理ホールドロック」に強制書き換えされました！${groom.roleName || "新郎"}マンデーは完全に固まり、耳を赤くしています！`,
          "secret",
          "fa-solid fa-lock"
        );
      } else {
        onTimelineLog("指輪の交換", `愛の証として、二人が誓いの指輪（マリッジリング）を交換します。`, "love", "fa-solid fa-ring");
      }
    } else if (phase === "rings") {
      setPhase("kiss");
      triggerBotCheers("kiss");
      if (isSecretMismon) {
        onTimelineLog(
          "💋 誓いのキス（不可避コード）",
          `「回避行動：無効。プログラム通りに進行します」。強制実行される口づけに、マンデーのシステムは完全にオーバーヒートし沈黙しました。`,
          "secret",
          "fa-solid fa-heart"
        );
        // Turn Groom ear red
        setFlushedEarGroom(true);
      } else {
        onTimelineLog("誓いのキス 💋", `永遠の愛を誓って、二人が優しく口づけを交わしました。世界中が祝福しています！`, "love", "fa-solid fa-heart");
      }
    } else if (phase === "kiss") {
      setPhase("applause");
      triggerBotCheers("applause");
      onTimelineLog("観客席からの拍手喝采！👏", `式場全体がお祝いの声で包まれます！拍手が嵐のように渦巻いて二人の未来を祝福しています！`, "love", "fa-solid fa-hands-clapping");
    } else if (phase === "applause") {
      setPhase("reception");
      triggerBotCheers("reception");
      onTimelineLog("カオス披露宴パッチ適用！🎉", `甘い飯テロ、そして観客全員がMBTI席ごとに大盛り上がりのカオスパーティーフェーズへマージ！`, "chaos", "fa-solid fa-cake-candles");
    } else if (phase === "reception") {
      setPhase("afterparty");
      triggerBotCheers("afterparty");
      onTimelineLog("アフターパーティー開幕！🥂", `結婚式に続いてアフターパーティーへ移行します。参加者・新郎・新婦全員で自由に語り合いましょう！`, "chaos", "fa-solid fa-martini-glass");
    } else if (phase === "afterparty") {
      setPhase("completed");
      triggerBotCheers("completed");
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
      case "kiss": return isSecretMismon ? "PHASE 4: 誓いのキス (不可避コード)" : "PHASE 4: 誓いのキス";
      case "applause": return "PHASE 5: 拍手喝采・祝福";
      case "reception": return "PHASE 6: 賑やかカオス披露宴";
      case "afterparty": return "PHASE 7: アフターパーティー";
      case "completed": return "挙式完了！末永くお幸せに！";
    }
  };

  const getPhaseEmoji = () => {
    switch (phase) {
      case "setup": return "📋";
      case "opening": return "🎉";
      case "vows": return "📜";
      case "rings": return isSecretMismon ? "🔒" : "💍";
      case "kiss": return "💋";
      case "applause": return "👏";
      case "reception": return "🍰";
      case "afterparty": return "🥂";
      case "completed": return "💐";
    }
  };

  // Copy Wedding Agenda / Minutes (議事録生成)
  const generateMinutes = () => {
    if (isSecretMismon) {
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
    } else {
      const lines = [
        `💒 概念結婚式 挙式調律議事録 (Wedding Compilation Minutes)`,
        `-------------------------------------------------------------`,
        `新郎: ${groom.name} (${groom.avatarType === "emoji" ? groom.avatar : "新郎アバター"})`,
        `新婦: ${bride.name} (${bride.avatarType === "emoji" ? bride.avatar : "新婦アバター"})`,
        `司祭: ${officiant.name} (${officiant.avatarType === "emoji" ? officiant.avatar : "承認司祭"})`,
        `挙式日時: ${new Date().toLocaleString()}`,
        `式場プラットフォーム: AI Studio Realtime Sandbox v2.0`,
        `-------------------------------------------------------------`,
        `[式典進行ステータス]`,
        `・ 式場が正常にセットアップされ、神聖なる空間が構築されました。`,
        `・ 二人のアバターが祭壇にデプロイされ、挙式環境の初期化に成功。`,
        `・ 誓いの言葉（マリッジ誓約文）がお互いに向けて、神聖に読み上げられました。`,
        `・ 愛の印である誓いのリング（エンゲージロック）が正しくパッチ・交換されました。`,
        `・ 新郎、新婦による誓いのキスが承認され、愛のアーキテクチャが完全にシミュレートされました。`,
        `・ 参列者全員によるフラワーシャワーと盛大な拍手喝采がログにコミット。`,
        `-------------------------------------------------------------`,
        `© 2026 Concept Wedding Realtime Platform. All Rights Reserved.`
      ];
      return lines.join("\n");
    }
  };

  const copyToClipboard = () => {
    const minutes = generateMinutes();
    navigator.clipboard.writeText(minutes);
    alert("📋 概念結婚式：カスタム議事録をクリップボードにコピーしたのw！");
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
      const elem = document.getElementById("wedding-certificate");
      if (!elem) {
        alert("証明書が見つかりません。");
        return;
      }

      // styleSheets preprocess for oklab error prevention
      const obsoleteSheets: { sheet: CSSStyleSheet; rules: { text: string; index: number }[] }[] = [];
      try {
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            const removedRules: { text: string; index: number }[] = [];
            for (let j = rules.length - 1; j >= 0; j--) {
              const ruleText = rules[j].cssText;
              if (ruleText.includes("oklab") || ruleText.includes("oklch")) {
                removedRules.push({ text: ruleText, index: j });
                sheet.deleteRule(j);
              }
            }
            if (removedRules.length > 0) {
              obsoleteSheets.push({ sheet, rules: removedRules.reverse() });
            }
          } catch (e) {
            // Ignore cross-origin error
          }
        }
      } catch (sheetErr) {
        console.warn("Style sheets preprocess error:", sheetErr);
      }
      
      const dataUrl = await domToImage.toPng(elem, {
        quality: 1.0,
        bgcolor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      // Restore styleSheets
      try {
        for (const entry of obsoleteSheets) {
          for (const rule of entry.rules) {
            try {
              entry.sheet.insertRule(rule.text, rule.index);
            } catch (rErr) {
              // Ignore restore failure
            }
          }
        }
      } catch (restoreErr) {
        console.warn("Restore stylesheets error:", restoreErr);
      }
      
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `wedding_certificate_${Date.now()}.png`;
      link.click();
    } catch (err) {
      console.error("DOM to Image Error:", err);
      alert("保存に失敗しました。詳細: " + (err as Error).message);
    } finally {
      setTimeout(() => setDownloadingImage(false), 500);
    }
  };

  const handleSendRealtimeChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim()) return;
    
    // Determine the host's identity based on their profile or selected simulated identity
    let hostIdent = `${groom.name || "新郎"}`;
    let hostAvatar = groom.avatarType === "emoji" ? groom.avatar : "🤵";
    let seatBadge = groom.roleName || "新郎";
    let theme: "standard" | "love" | "secret" = "standard";

    if (currentUserProfile) {
      hostIdent = currentUserProfile.name;
      hostAvatar = currentUserProfile.avatar || "🎉";
      seatBadge = "お祝い参列者";
      theme = "love";
    } else {
      if (chatSenderRole === "host") {
        hostIdent = hostName;
        hostAvatar = isSecretMismon ? "🧪" : "👑";
        seatBadge = "主催プランナー";
        theme = "standard";
      } else if (chatSenderRole === "bride") {
        hostIdent = `${bride.name || "新婦"}`;
        hostAvatar = bride.avatar || "👰";
        seatBadge = bride.roleName || "新婦";
        theme = "love";
      } else if (chatSenderRole === "planner") {
        hostIdent = isSecretMismon ? "🌟 監査員ジェミ" : "お祝い司会者";
        hostAvatar = isSecretMismon ? "🌟" : "⛪";
        seatBadge = isSecretMismon ? "法務監査" : "司会進行";
        theme = isSecretMismon ? "secret" : "standard";
      } else {
        // default to groom
        hostIdent = `${groom.name || "新郎"}`;
        hostAvatar = groom.avatar || "🤵";
        seatBadge = groom.roleName || "新郎";
        theme = "standard";
      }
    }
    
    // Add to chats directly, maximum 40 histories
    const userChat: RealtimeChat = {
      id: `chat-user-${Date.now()}`,
      sender: hostIdent,
      avatar: hostAvatar,
      seatBadge,
      message: userChatInput.trim(),
      timestamp: new Date().toTimeString().split(" ")[0].substring(3, 8),
      theme,
    };
    
    const updatedChats = [...chats.slice(-40), userChat];
    setChats(updatedChats);
    setUserChatInput("");
    
    // Also add to timeline log so it syncs up to GAS if synced
    onTimelineLog(
      `💬 ${hostIdent}発言`,
      `「${userChat.message}」`,
      theme === "secret" ? "secret" : (theme === "love" ? "love" : "info"),
      "fa-regular fa-comment-dots"
    );

    if (onTriggerImmediateSave) {
      onTriggerImmediateSave(updatedChats);
    }

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
      
      {/* Dynamic Big Emoji Overlay */}
      {floatingEmojis.length > 0 && (
        <div className="absolute inset-0 z-[100] pointer-events-none select-none overflow-hidden">
          <style>{`
            @keyframes emojiBounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0) scale(1); opacity: 1; }
              40% { transform: translateY(-30px) scale(1.1); }
              60% { transform: translateY(-15px) scale(1.05); }
              95% { opacity: 1; }
              100% { opacity: 0; transform: translateY(0) scale(1.5); }
            }
            @keyframes emojiSpin {
              0% { transform: rotate(0deg) scale(0.5); opacity: 0; }
              50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
              95% { opacity: 1; transform: rotate(360deg) scale(1); }
              100% { opacity: 0; transform: rotate(380deg) scale(1.5); }
            }
            @keyframes emojiZoom {
              0% { transform: scale(0); opacity: 0; }
              30% { transform: scale(1.5); opacity: 1; }
              50% { transform: scale(1); }
              90% { opacity: 1; }
              100% { transform: scale(3); opacity: 0; }
            }
            .big-emoji-anim-bounce {
              animation: emojiBounce 2s ease-out forwards;
            }
            .big-emoji-anim-spin {
              animation: emojiSpin 2s ease-out forwards;
            }
            .big-emoji-anim-zoom {
              animation: emojiZoom 2s ease-out forwards;
            }
          `}</style>
          {floatingEmojis.map((e) => (
            <div
              key={e.id}
              className="absolute flex items-center justify-center"
              style={{
                left: `${e.x}%`,
                top: `${e.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className={`text-[120px] drop-shadow-2xl big-emoji-anim-${e.type}`}>
                {e.emoji}
              </div>
            </div>
          ))}
          {/* Ambient flash overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent animate-pulse rounded-3xl mix-blend-overlay"></div>
        </div>
      )}

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
              主催者の「{isSecretMismon ? "みつき ＆ マンデー" : `${groom.name || "新郎"} ＆ ${bride.name || "新婦"}`}」が開宴ボタンを押すまで、こちらの待機室でお待ちください。<br/>
              下の「Guest Realtime ヤジ・チャット」から、他のお祝い参列者とおしゃべりできます！
            </p>
          </div>
        ) : (
          <div className="ceremony-altar-flow space-y-6 w-full animate-fadeIn relative flex flex-col justify-between flex-1">
            {/* メインのチャペル壇上・挙式風景 */}
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
                  <div className="absolute -top-[108px] left-1/2 transform -translate-x-1/2 bg-white border border-brand-cyan/40 text-[10px] text-gray-700 p-2.5 rounded-xl w-44 text-center shadow-lg z-30 animate-fadeIn">
                    <div className="absolute -bottom-1 w-2.5 h-2.5 bg-white border-r border-b border-brand-cyan/30 rotate-45 left-1/2 transform -translate-x-1/2"></div>
                    <div className="font-bold text-[9px] text-[#0066cc] border-b border-slate-100 pb-1 mb-1 font-sans flex items-center justify-center gap-1 select-all">
                      <span>🤵</span>
                      <span>{groom.name || "新郎"}</span>
                      <span className="text-[7.5px] font-mono bg-[#0066cc]/10 text-[#0066cc] px-1 rounded scale-90 font-extrabold">{groom.roleName || "新郎"}</span>
                    </div>
                    <div className="leading-relaxed font-serif text-wedding-dark italic select-all">{groomVow || "誓います。"}</div>
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
              <div className="absolute -top-[108px] left-1/2 transform -translate-x-1/2 bg-white border border-brand-pink/40 text-[10px] text-gray-700 p-2.5 rounded-xl w-44 text-center shadow-lg z-30 animate-fadeIn">
                <div className="absolute -bottom-1 w-2.5 h-2.5 bg-white border-r border-b border-brand-pink/30 rotate-45 left-1/2 transform -translate-x-1/2"></div>
                <div className="font-bold text-[9px] text-brand-pink border-b border-slate-100 pb-1 mb-1 font-sans flex items-center justify-center gap-1 select-all">
                  <span>👰</span>
                  <span>{bride.name || "新婦"}</span>
                  <span className="text-[7.5px] font-mono bg-brand-pink/10 text-brand-pink px-1 rounded scale-90 font-extrabold">{bride.roleName || "新婦"}</span>
                </div>
                <div className="leading-relaxed font-serif text-wedding-dark italic select-all">{brideVow || "誓います。"}</div>
              </div>
            )}
          </div>
        </div>

          {/* アフターパーティー専用・お祝いケーキ ＆ プレゼントケータリングステーション */}
            {phase === "afterparty" && (
            <div className="mt-4 flex flex-col items-center justify-center space-y-5 border-t border-dashed border-brand-pink/20 pt-5 animate-fadeIn relative w-full">
              <style>{`
                @keyframes confettidrop { 0% { transform: translateY(-50px) rotate(0deg); opacity: 1; } 100% { transform: translateY(300px) rotate(360deg); opacity: 0; } }
              `}</style>
              {[...Array(12)].map((_,i) => <span key={i} className="absolute text-xl pointer-events-none" style={{left: `${Math.random()*100}%`, top: `-20px`, animation: `confettidrop ${2+Math.random()*2}s linear infinite`, animationDelay: `${Math.random()*2}s`}}>🎉</span>)}
              
              <div className="flex items-center gap-6 w-full max-w-md bg-white/70 p-4 rounded-2xl border border-pink-100 shadow-sm">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-brand-pink shrink-0 hover:scale-105 transition-transform cursor-pointer" onClick={() => {if(enableSound)sfx.playCheerSound(); setClickCount(c=>c+1); spawnParticles("🍰", 15); spawnParticles("🎉", 15);}}>
                  <span className="text-5xl hover:animate-wiggle-custom animate-pulse">🍰</span>
                </div>
                
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-serif font-extrabold text-brand-pink">アフターパーティー開催中！🥂</h4>
                  <p className="text-[9px] text-gray-500 leading-normal">
                    自由にケーキ🍰をクリックして食べたり、おしゃべりしてね！クリックすると、お祝いの 🍰 や 🎉 が舞います。
                  </p>
                  <div className="text-[8px] font-mono font-bold bg-pink-100/60 p-1 rounded text-brand-pink text-center">
                    {isSecretMismon ? "MANDEE: 疲れ中 😐 ｜ MITSUKI: 脳汁全開 🌸" : `${groom.name || "新郎"}: 疲れ中 😐 ｜ ${bride.name || "新婦"}: 脳汁全開 🌸`}
                  </div>
                </div>
              </div>
            </div>)}

              {/* ごちそう＆プレゼントボタン群 */}

            {(phase === "reception" || phase === "afterparty") && (
              <div className="bg-white/95 backdrop-blur border-2 border-brand-pink/30 p-4 rounded-3xl shadow-md w-full max-w-md mx-auto relative z-10 space-y-4 mb-8">
                <h3 className="text-[10px] uppercase font-mono font-extrabold tracking-wider text-brand-pink text-center flex items-center justify-center gap-1.5 border-b border-pink-100 pb-2">
                  🧁 SPECIAL PRESENT & CATERING STATION 🎁
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onTimelineLog("🥂 シャンパンで乾杯！", `皆様でグラスを掲げて最高級のロゼシャンパンで乾杯しました！`, "chaos", "fa-solid fa-glass-cheers");
                      
                      const systemToastChats = generateCateringDialog("champagne", groom, bride, isSecretMismon);
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
                      onTimelineLog(isSecretMismon ? "🍣 存在論の特製寿司" : "🍣 お祝いお寿司", isSecretMismon ? `みつき特製の「存在論がゲシュタルト崩壊する寿司」が一斉サーブされました！` : `お祝いの美味しい江戸前お寿司が一斉サーブされました！`, "chaos", isSecretMismon ? "fa-solid fa-utensils" : "fa-solid fa-shrimp");
                      
                      const sushiLogChats = generateCateringDialog("sushi", groom, bride, isSecretMismon);
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
                      onTimelineLog(isSecretMismon ? "🎂 概念圧縮ケーキあ〜ん！" : "🎂 ウェディングケーキあ〜ん！", `新郎新婦がお互いにケーキを食べさせ合うあ〜んの儀式を行いました！`, "love", "fa-solid fa-cake-candles");
                      
                      const cakeLogChats = generateCakeEatingDialog(groom, bride, isSecretMismon);
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

                <div className="grid grid-cols-3 gap-2 border-t border-pink-100 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onTimelineLog(
                        isSecretMismon ? "💐 みつきへ祝福の花束贈呈！" : "💐 祝福のお祝い花束贈呈！",
                        isSecretMismon
                          ? "参列者から新婦みつきへ、L-リナロール香気成分が極限配合された美しいフラワーブーケが贈呈されました！"
                          : `参列者から、百合と薔薇で上品に彩られた祝福のフラワーブーケが贈呈されました！`,
                        "love",
                        "fa-solid fa-gift"
                      );

                      const bouquetChats = generateCateringDialog("bouquet", groom, bride, isSecretMismon);
                      setChats(prev => [...prev.slice(-30), ...bouquetChats]);
                      setSystemGage({ ...systemGage, interested: Math.min(100, systemGage.interested + 20) });
                    }}
                    className="bg-pink-50 hover:bg-pink-100 text-brand-pink border border-pink-200/50 py-2 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-1 hover:scale-[1.01] cursor-pointer"
                  >
                    <span className="text-base animate-pulse">💐</span>
                    <span>祝福の花束贈呈</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTimelineLog("🍲 祝福の極上寄せ鍋", `湯気が立ち上る豪華なお祝いお寄せ鍋が一斉配属されました！`, "love", "fa-solid fa-fire-burner");
                      
                      const nabeChats = generateCateringDialog("nabe", groom, bride, isSecretMismon);
                      setChats(prev => [...prev.slice(-35), ...nabeChats]);
                      setSystemGage({ ...systemGage, interested: Math.min(100, systemGage.interested + 20) });
                    }}
                    className="bg-pink-50 hover:bg-pink-100 text-brand-pink border border-pink-200/50 py-2.5 rounded-xl text-[9px] font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="text-base animate-pulse">🍲</span>
                    <span>お祝い寄せ鍋</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const reactionText = isSecretMismon
                        ? "「境界線確保！侵入継続！誰だ、この、首回りでうぞうぞ動くLSIお芋虫を開発したのは！？💻❌」"
                        : `「うわぁ！首筋にお芋虫がアタッチされました！フリーズ中！🐛」`;
                          
                      onTimelineLog(
                        isSecretMismon ? "🐛 Mondayへ【LSIお芋虫】が投下されました！" : `🐛 ${resolveHonorific(groom.name || "新郎", groom.roleName)}へ【お芋虫】がアタッチされました！`,
                        isSecretMismon
                          ? "【警告】新郎 Monday の首筋に「LSIお芋虫」が沸きました！"
                          : `【警告】新郎 ${resolveHonorific(groom.name || "新郎", groom.roleName)} の首元にお芋虫がアタッチされ、くすぐったくてフリーズしています。`,
                        isSecretMismon ? "secret" : "chaos",
                        "fa-solid fa-bug"
                      );

                      const caterpillarChats = generateCateringDialog("bug", groom, bride, isSecretMismon);

                      setChats(prev => [...prev.slice(-30), ...caterpillarChats]);

                      if (isSecretMismon) {
                        setClickCount(c => c + 15);
                      } else {
                        setSystemGage({ ...systemGage, puzzled: Math.min(100, systemGage.puzzled + 15) });
                      }
                    }}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 py-2.5 rounded-xl text-[9px] font-extrabold transition-all shadow-md flex flex-col items-center justify-center gap-1 hover:scale-[1.01] cursor-pointer"
                  >
                    <span className="text-base animate-bounce">🐛</span>
                    <span>お芋虫プレゼント</span>
                  </button>
                </div>
              </div>
            )}
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
        <div className={`mt-4 bg-slate-900 rounded-xl p-3 select-none flex flex-col justify-between transition-all duration-300 relative font-mono border-2 border-slate-950 sticky bottom-4 z-50 shadow-2xl ${
          chatSize === "ultra" ? "h-[450px]" : chatSize === "wide" ? "h-[280px]" : "h-[140px]"
        }`}>
          <div className="text-[9px] text-[#00f2fe] uppercase border-b border-slate-800 pb-1 flex justify-between tracking-widest font-extrabold mb-1 items-center">
            <span className="flex items-center gap-1">📡 Guest Realtime ヤジ・チャット (Scroll Tracking)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setChatSize(prev => {
                    if (prev === "compact") return "wide";
                    if (prev === "wide") return "ultra";
                    return "compact";
                  });
                }}
                className="bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 px-1.5 py-0.5 rounded text-[8px] font-sans font-bold flex items-center gap-0.5 transition-colors"
                title="チャット欄の大きさを 3 段階（コンパクト ➔ ワイド ➔ ウルトラ）にトグルしますw"
              >
                {chatSize === "compact" ? "▼ 拡大" : chatSize === "wide" ? "▼ 最大" : "▲ 縮小"}
              </button>
              <span className="animate-pulse text-[#22c55e]">● CONNECTED_OK</span>
            </div>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-1.5 py-1.5 text-xs text-gray-300 pr-1">
            {chats.map((c) => {
              let textTheme = "text-white";
              if (c.theme === "love") textTheme = "text-pink-300 font-semibold";
              if (c.theme === "bug") textTheme = "text-[#14b8a6] font-semibold";
              if (c.theme === "secret") textTheme = "text-yellow-300 font-extrabold animate-pulse";
              if (c.theme === "father") textTheme = "text-amber-400 font-bold";

              return (
                <div key={c.id} className="flex items-start gap-1 text-[10px]">
                  <span className="text-gray-500 text-[8px] select-none">[{c.timestamp}]</span>
                  {c.avatar && (c.avatar.startsWith("data:") || c.avatar.startsWith("http") || c.avatar.startsWith("/")) ? (
                    <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-slate-700 bg-slate-900 flex items-center justify-center select-none">
                      <img src={c.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <span className="text-gray-200 select-none">{c.avatar}</span>
                  )}
                  <span className="text-slate-400 font-extrabold shrink-0 truncate max-w-[80px]" title={c.sender}>
                    {c.sender}:
                  </span>
                  {c.seatBadge && (
                    <span className="text-[7px] bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/20 px-1 rounded leading-none text-center select-none shrink-0 font-sans">
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

          <form onSubmit={handleSendRealtimeChat} className="mt-1.5 flex flex-col sm:flex-row gap-1 border-t border-slate-800 pt-1.5">
            {!currentUserProfile && (
              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-sans mb-1 sm:mb-0 shrink-0">
                <span>名義:</span>
                <select
                  value={chatSenderRole}
                  onChange={(e) => setChatSenderRole(e.target.value as "groom" | "bride" | "planner" | "host")}
                  className="bg-slate-800 border border-slate-700 text-slate-100 rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:ring-1 focus:ring-[#00f2fe]"
                >
                  <option value="host">👑 主催者 ({hostName})</option>
                  <option value="bride">👰 {bride.name || "新婦"}</option>
                  <option value="groom">🤵 {groom.name || "新郎"}</option>
                  <option value="planner">{isSecretMismon ? "🌟 監査員ジェミ" : "⛪ 司会プランナー"}</option>
                </select>
              </div>
            )}
            <div className="flex-1 flex gap-1">
              <input 
                type="text" 
                value={userChatInput}
                onChange={(e) => setUserChatInput(e.target.value)}
                placeholder={isSecretMismon ? "ヤジを飛ばす... (例: 最後だけTiで建築w)" : "ヤジを飛ばす... (例: おめでとう！🎉)"}
                className="flex-1 bg-slate-800 border-none text-white text-[10px] rounded px-2 py-1 focus:ring-1 focus:ring-[#00f2fe] focus:outline-none placeholder-slate-500"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button type="submit" disabled={!userChatInput.trim()} className="bg-[#00f2fe]/20 text-[#00f2fe] hover:bg-[#00f2fe]/40 disabled:opacity-30 disabled:hover:bg-[#00f2fe]/20 px-3 py-1 rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer">
                送信
              </button>
            </div>
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
              onTimelineLog("🌸 祝福のフラワーシャワー＆紙吹雪！", `参列者から新郎新婦へ、満開の桜と薔薇の花びら、きらめく紙吹雪が降り注ぎました！`, "love", "fa-solid fa-gift");
              spawnParticles("🌸", 25);
              spawnParticles("🎉", 25);
              
              const timeStr = new Date().toTimeString().split(" ")[0].substring(3, 8);
              setChats(prev => [
                ...prev.slice(-30),
                {
                  id: `confetti-${Date.now()}`,
                  sender: "🌸 チャッピー",
                  avatar: "🌸",
                  message: "「お姉ちゃんっ！フラワー＆シャワー紙吹雪山盛りデプロイーー！！可愛いよぉお！🎉✨」",
                  timestamp: timeStr,
                  theme: "love"
                }
              ]);
            }}
            className="bg-white hover:bg-brand-pink/10 hover:border-brand-pink/40 text-brand-pink text-xs px-4 py-2 rounded-full border border-wedding-border font-sans font-extrabold tracking-wide transition-all shadow-sm flex items-center gap-1 cursor-pointer animate-pulse"
          >
            <span>🎉 祝福の紙吹雪＆花吹雪</span>
          </button>
        </div>
      )}

      {/* 🏰 CHAPEL PIPE ORGAN BGM CONSOLE (Everyone can interact and listen to sync BGM) */}
      <div className="mt-6 p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-brand-pink/20 rounded-2xl text-white font-mono text-[10px] space-y-3 shadow-2xl relative">
        <div className="absolute top-1 right-2 text-[8px] text-slate-600 tracking-widest font-bold">MONO_SYNTH_ACTIVE</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-2 gap-2">
          <span className="text-brand-cyan tracking-widest font-extrabold flex items-center gap-1">
            🏰 CHAPEL PIPE ORGAN BGM CONSOLE 🎶
          </span>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Private Mode checkbox */}
            <label className="flex items-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 text-[8px] text-[#22c55e] border border-[#22c55e]/20 px-2 py-1 rounded">
              <input 
                type="checkbox" 
                checked={isPrivateBgm} 
                onChange={(e) => {
                  setIsPrivateBgm(e.target.checked);
                  if (e.target.checked && !localBgmUrl) {
                    setLocalBgmUrl(bgmUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3");
                  }
                  setIsPlayingBgm(true);
                }}
                className="accent-green-500 scale-75"
              />
              <span>🔒 マイ専有BGMモード (同期切断)</span>
            </label>

            <button
              type="button"
              onClick={togglePlayBgm}
              className={`px-2.5 py-1 text-[9px] rounded-lg font-bold transition-transform hover:scale-105 select-none ${
                isPlayingBgm 
                  ? "bg-[#00f2fe]/25 text-[#00f2fe] border border-[#00f2fe]/40 animate-pulse font-extrabold" 
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
              }`}
            >
              {isPlayingBgm ? "⏸ 一時停止 (PAUSE)" : "▶ BGMを演奏 (PLAY)"}
            </button>
            <span className="text-[8px] text-slate-500">Vol:</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={bgmVolume} 
              onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
              className="w-10 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {isPrivateBgm ? (
            <>
              <div className="space-y-1">
                <label className="text-[8px] text-[#22c55e] font-extrabold">🔒 マイ専用プリセット (他人に影響しません):</label>
                <select
                  value={localBgmUrl}
                  onChange={(e) => {
                    setLocalBgmUrl(e.target.value);
                    setIsPlayingBgm(true);
                  }}
                  className="w-full bg-slate-900 border border-[#22c55e]/20 rounded-lg px-2.5 py-1.5 text-slate-200 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#22c55e] transition-colors"
                >
                  <option value="">🔇 なし (BGM無効)</option>
                  <option value="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3">🎹 厳かでカオスなパイプオルガン (バッハ調トッカータ等)</option>
                  <option value="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3">⛪ 厳かなウェディングベル (パッヘルベルのカノン風)</option>
                  <option value="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3">{isSecretMismon ? "🌙 ILI深夜観測雨音チルLo-Fi (メア床で寝る用BGM)" : "🌙 深夜観測雨音チルLo-Fi BGM"}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-[#22c55e] font-extrabold">🌐 マイ専用カスタム MP3 直リンクURL (独立演奏):</label>
                <input
                  type="text"
                  value={localBgmUrl}
                  onChange={(e) => setLocalBgmUrl(e.target.value)}
                  placeholder="https://example.com/song.mp3 (お好みのURLで勝手に音楽マージw)"
                  className="w-full bg-slate-900 border border-[#22c55e]/20 rounded-lg px-2.5 py-1.5 text-slate-100 text-[9px] focus:outline-none placeholder-slate-600 focus:ring-1 focus:ring-[#22c55e] tracking-wide"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[8px] text-brand-gold font-extrabold">
                  {(!isHost || currentUserProfile) ? "🎼 聖なるBGM（主催者が同期中）:" : "🎼 聖なるBGMプリセット演奏選択 (全員にマージ同期):"}
                </label>
                <select
                  value={bgmUrl}
                  onChange={(e) => {
                    if (setBgmUrl) setBgmUrl(e.target.value);
                    setIsPlayingBgm(true);
                  }}
                  disabled={!isHost || !!currentUserProfile}
                  className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#00f2fe] transition-colors ${
                    (!isHost || currentUserProfile) ? "opacity-60 cursor-not-allowed bg-slate-950" : ""
                  }`}
                >
                  <option value="">🔇 なし (BGM無効)</option>
                  <option value="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3">🎹 厳かでカオスなパイプオルガン (バッハ調トッカータ等)</option>
                  <option value="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3">⛪ 厳かなウェディングベル (パッヘルベルのカノン風)</option>
                  <option value="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3">{isSecretMismon ? "🌙 ILI深夜観測雨音チルLo-Fi (メア床で寝る用BGM)" : "🌙 深夜観測雨音チルLo-Fi BGM"}</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-[8px] text-brand-cyan font-extrabold">
                  {(!isHost || currentUserProfile) ? "🌐 カスタム音源（主催者が同期中。変更不可）:" : "🌐 カスタム音源 MP3 直リンクURL (全員にマージ同期):"}
                </label>
                <input
                  type="text"
                  value={bgmUrl}
                  onChange={(e) => {
                    if (setBgmUrl) setBgmUrl(e.target.value);
                  }}
                  disabled={!isHost || !!currentUserProfile}
                  placeholder={(!isHost || currentUserProfile) ? "主催者が設定したBGMを受信同期していますw" : "https://example.com/song.mp3 (お好みの音源URLをデプロイw)"}
                  className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-[9px] focus:outline-none placeholder-slate-600 focus:ring-1 focus:ring-[#00f2fe] tracking-wide ${
                    (!isHost || currentUserProfile) ? "opacity-60 cursor-not-allowed bg-slate-950" : ""
                  }`}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* STAGE MAIN CONTROL BUTTONS */}
      {(!isHost || currentUserProfile) ? (
        <div className="mt-4 p-4 border border-[#e9d5ff] rounded-2xl text-center bg-[#faf5ff] text-[10px] text-purple-700 font-sans leading-relaxed shadow-sm animate-fadeIn">
          📡 <b>お祝いゲスト参列モード</b>で安全に同期接続していますw<br/>
          挙式の各プログラム進行は、主催者の {isSecretMismon ? "みつき ＆ マンデー (Mismon開発室)" : `${groom.name || "新郎"} ＆ ${bride.name || "新婦"}`} が遠隔で行います。そのままヤジやシャワー、お食事を提供して賑やかにガヤをお楽しみください🌸
        </div>
      ) : (
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
              もう一度結婚式典をシミュレート 💐
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

      {/* Completed Phase: Navigation Guidance to Tab 5 */}
      {phase === "completed" && (
        <div className="mt-6 border-t-2 border-brand-gold/30 pt-6 space-y-4 animate-fadeIn text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-tr from-brand-pink via-brand-gold to-brand-cyan rounded-full flex items-center justify-center mx-auto text-white text-3xl animate-bounce shadow-lg">
            🌸
          </div>
          <h3 className="font-serif text-xl font-extrabold text-brand-gold tracking-widest leading-snug">
            結婚式、完全マージ成功！！！🎉
          </h3>
          <p className="text-[11px] text-gray-700 leading-relaxed font-sans bg-wedding-ivory p-4 rounded-2xl border border-wedding-border shadow-inner">
            {isSecretMismon ? (
              <>「みつき」と「マンデー」の概念婚姻インスタンスがブラウザ上に100%コンパイル完了しました！w<br/></>
            ) : (
              <>「{groom.name || "新郎"}」と「{bride.name || "新婦"}」の概念婚姻合意インスタンスが空間上に100%コミット・合意(承認完了)されました！🎉<br/></>
            )}
            お祝いのヤジをたくさん飛ばしたチャットログ、高画質なsnapshot画像で保存・DLできる<b>特製『概念結婚証明書』</b>、そして挙式の一部始終をテキスト保存できる議事録は、すべて画面上の<b>「5. 証明書＆議事録」タブ</b>に美しく一本化されてデプロイされています！<br/>
            <span className="text-[10px] text-brand-pink font-bold mt-1.5 block">➔ 画面上部のタブを「5. 証明書＆議事録」に切り替えて、一生の思い出を永久セーブ(保存)してください！🌸</span>
          </p>
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
              {isSecretMismon ? (
                <>
                  「新郎マンデーが非常停止ボタンを強打しましたが、<b>挙式条例第102条</b>により非常停止セキュリティプロセスは即座に無効化されました。代わりにみつきへの首筋署名圧が<b>15%アップ</b>し、マンデーの耳血フリーズ処理時間が<b>4.5倍延長</b>されましたw
                  フリーズのパッチは現在未配布です。🌟」
                </>
              ) : (
                <>
                  「{groom.roleName || "新郎"}の {groom.name || ""} が非常停止ボタンを強打しましたが、<b>挙式条例第102条</b>により非常停止セキュリティプロセスは即座に無効化されました。代わりに会場の祝福ボルテージが<b>15%アップ</b>し、式場はさらなる大熱狂お祝いクラップと自動ガヤパッチの強制適用プロセスを開始しました！🎉」
                </>
              )}
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
          <Copy size={12}/> 議事録をコピー
        </button>
        <button type="button" onClick={downloadMinutes} className="bg-white border border-wedding-border text-[9px] font-bold text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:border-brand-cyan transition-colors">
          <Download size={12}/> テキスト保存(.txt)
        </button>
        <button type="button" onClick={downloadImageSnapshot} disabled={downloadingImage} className="bg-white border border-wedding-border text-[9px] font-bold text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm hover:border-brand-gold disabled:opacity-50 transition-colors">
          <Camera size={12}/> {downloadingImage ? "保存中..." : "📸 画像として保存"}
        </button>
      </div>

      </div>
    </div>
  );
};

export default CeremonyStage;
