/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import {
  Character,
  Guest,
  WeddingLog,
  WeddingPhase,
  SystemGage,
  Officiant,
  WeddingRoom,
  RealtimeChat,
} from "./types";
import { GroomBrideSetup } from "./components/GroomBrideSetup";
import { GuestList } from "./components/GuestList";
import { CeremonyStage } from "./components/CeremonyStage";
import { WeddingTimeline } from "./components/WeddingTimeline";
import {
  Heart,
  Sparkles,
  Smile,
  MessageCircle,
  Clipboard,
  HelpCircle,
  Layers,
  Settings,
  AppWindow,
  RotateCcw,
  Camera,
  Download,
  Mail,
} from "lucide-react";
import * as sfx from "./utils/audio";
import { toPng } from "html-to-image";

export const DEFAULT_GAS_URL =
  "https://script.google.com/macros/s/AKfycbwechr-U1vo_l4ENTT59Bpvkkz7YzX26dauSswW4k_alTwefCWXTUCz5ax0jLtjaef1/exec";

type ActiveTab = "lobby" | "setup" | "guests" | "altar" | "completed";

export default function App() {
  const prevPhaseRef = useRef<WeddingPhase>("setup");

  // 1. Core States (Initially restored from localStorage to defeat the infamous LINE browser/webview reload crash!)
  const [groom, setGroom] = useState<Character>(() => {
    try {
      const saved = localStorage.getItem("wedding_groom");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("localStorage load groom failed", e);
    }
    return { name: "", avatarType: "emoji", avatar: "🤵", roleName: "新郎" };
  });

  const [bride, setBride] = useState<Character>(() => {
    try {
      const saved = localStorage.getItem("wedding_bride");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("localStorage load bride failed", e);
    }
    return { name: "", avatarType: "emoji", avatar: "👰", roleName: "新婦" };
  });

  const [officiant, setOfficiant] = useState<Officiant>(() => {
    try {
      const saved = localStorage.getItem("wedding_officiant");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("localStorage load officiant failed", e);
    }
    return { name: "", avatarType: "emoji", avatar: "🌟" };
  });

  const [groomVow, setGroomVow] = useState<string>(() => {
    return localStorage.getItem("wedding_groomVow") || "お互いを尊重し、末永く共に歩むことを誓います。";
  });
  const [brideVow, setBrideVow] = useState<string>(() => {
    return localStorage.getItem("wedding_brideVow") || "お互いを守り抜き、どんなカオスも共に楽しむことを誓います。";
  });

  // Autosave setup states to localstorage (Super immunity against Line browser automatic reloads/crash!)
  useEffect(() => {
    try {
      localStorage.setItem("wedding_groom", JSON.stringify(groom));
    } catch (e) {}
  }, [groom]);

  useEffect(() => {
    try {
      localStorage.setItem("wedding_bride", JSON.stringify(bride));
    } catch (e) {}
  }, [bride]);

  useEffect(() => {
    try {
      localStorage.setItem("wedding_officiant", JSON.stringify(officiant));
    } catch (e) {}
  }, [officiant]);

  useEffect(() => {
    try {
      localStorage.setItem("wedding_groomVow", groomVow);
    } catch (e) {}
  }, [groomVow]);

  useEffect(() => {
    try {
      localStorage.setItem("wedding_brideVow", brideVow);
    } catch (e) {}
  }, [brideVow]);
  const [fillWithBugs, setFillWithBugs] = useState(true);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [logs, setLogs] = useState<WeddingLog[]>([]);
  const [chats, setChats] = useState<RealtimeChat[]>([]);
  const [phase, setPhase] = useState<WeddingPhase>("setup");
  const [bgmUrl, setBgmUrl] = useState("");
  const [downloadingImage, setDownloadingImage] = useState(false);

  // 概念結婚証明書の画像保存 (html-to-imageで超鮮明＆見切れ・CORS完全破破)
  const downloadImageSnapshot = async () => {
    const certElement = document.getElementById("marriage-certificate-board");
    if (!certElement) {
      console.warn(
        "Certificate target element #marriage-certificate-board not found!",
      );
      return;
    }
    setDownloadingImage(true);

    // 🌟 見切れ（右半分カット・左偏り）を100%根絶するための「一時的スタイル退避＆強制リセット」スーパーハック
    const originalStyle = certElement.getAttribute("style") || "";
    const originalClassName = certElement.className;

    // 親の flex/grid / mx-auto や 3D影、トランスフォームによる座標系のバグを完全に排除！
    const cleanClassName = originalClassName
      .replace("mx-auto", "")
      .replace("shadow-2xl", "");

    certElement.className = cleanClassName;
    
    // 撮影の一瞬だけ、要素を完全に「左上 margin=0」に固定し、幅を max-w-md の実寸 (448px) にガチガチ指定！
    certElement.style.position = "relative";
    certElement.style.margin = "0";
    certElement.style.padding = "24px";
    certElement.style.transform = "none";
    certElement.style.transition = "none";
    certElement.style.maxWidth = "448px";
    certElement.style.width = "448px";
    certElement.style.boxShadow = "none";

    // 🌟 一瞬だけ待機して、ブラウザにリフロー(レイアウトの再計算)とBase64画像のデコード・描画を100%確定させる！
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // 🚀 html-to-image の iOS/Safari での画像の一部または全体が真っ白（白飛び・ロード不全）になる既知のバグを完全粉砕！
      // 1回目のレンダリング（ダミー）：ブラウザ内部にCanvasとイメージデコードの準備をさせキャッシュを確保する。
      await toPng(certElement, {
        pixelRatio: 2.5,
        backgroundColor: "#fcf8f2",
        skipFonts: true,
        width: 448,
        height: certElement.offsetHeight,
      });

      // 極小のディレイを保証してブラウザの描画準備を100%完了させる
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 2回目のレンダリング（本番）：キャッシュされたデコード済みデータを使って完全な姿を確実にPNG化！
      const dataUrl = await toPng(certElement, {
        pixelRatio: 2.5, // 2.5倍の超美麗・超美細高解像度でエッジを滑らかにw
        backgroundColor: "#fcf8f2", // 最上のアイボリーカラーの台紙
        skipFonts: true, // Google Fonts等のCORSエラー(cssRulesプロパティ読み込み制限)を安全に回避！
        width: 448, // ぴったり 448px 横幅で正確無比に切りぬく
        height: certElement.offsetHeight, // 縦幅は実寸
      });

      const link = document.createElement("a");
      link.download = `marriage_certificate_${groom.name || "groom"}_and_${bride.name || "bride"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Certificate snapshot failed with html-to-image:", e);
    } finally {
      // 🌟 撮影が完了（または例外発生）したら、1ミリ秒の遅延もなく瞬時に元の綺麗なTailwindスタイルに100%完全復元！！！
      certElement.className = originalClassName;
      if (originalStyle) {
        certElement.setAttribute("style", originalStyle);
      } else {
        certElement.removeAttribute("style");
      }
      setDownloadingImage(false);
    }
  };

  // カオス議事録のテキストダウンロード (.txt)
  const downloadMinutes = () => {
    const lines = [
      `💒 概念結婚式 完全調律議事録 💒`,
      `=============================`,
      `新郎 (Groom): ${groom.name} (${groom.typologySeat || "未設定"})`,
      `新婦 (Bride): ${bride.name} (${bride.typologySeat || "未設定"})`,
      `司会・神父 (Witness): ${officiant.name}`,
      `挙式合意日付 (Date): ${new Date().toLocaleDateString()}`,
      `参列客数 (Attendance): ${guests.length}人`,
      ``,
      `【誓いの言葉 - 永久ログ】`,
      `新郎誓い: "${groomVow}"`,
      `新婦誓い: "${brideVow}"`,
      ``,
      `【挙式完全タイムライン履歴】`,
      ...logs.map((l) => `[${l.time}] ${l.title}: ${l.text}`),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wedding_minutes_${groom.name}_&_${bride.name}.txt`;
    link.click();
  };

  // クリップボードにカオス議事録をコピー
  const copyToClipboard = () => {
    const lines = [
      `💒 概念結婚式 完全調律議事録 - ${groom.name} & ${bride.name}`,
      `----------------------------------------------`,
      `新郎: ${groom.name}  /  新婦: ${bride.name}`,
      `新郎誓い: 「${groomVow}」`,
      `新婦誓い: 「${brideVow}」`,
      `参列客数: ${guests.length}名`,
      `\n結婚式ログ一覧:\n` +
        logs.map((l) => `- [${l.time}] ${l.title}: ${l.text}`).join("\n"),
    ].join("\n");
    navigator.clipboard.writeText(lines);
    alert("📋 議事録をクリップボードにコピーしました！");
  };

  // UX Tab-based flow navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>("lobby");

  // Private multi-room states
  const [rooms, setRooms] = useState<WeddingRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>(() => {
    return localStorage.getItem("wedding_activeRoomId") || "";
  });

  useEffect(() => {
    try {
      localStorage.setItem("wedding_activeRoomId", activeRoomId);
    } catch (e) {}
  }, [activeRoomId]);
  const [createRoomName, setCreateRoomName] = useState("");
  const [createHostName, setCreateHostName] = useState("");
  const [createCustomCode, setCreateCustomCode] = useState("");
  const [createRoomError, setCreateRoomError] = useState("");

  // Invitation & Password Online SUMMONS States
  const [myInvitationCode] = useState<string>(
    () => "SWEET-ROOM-" + Math.floor(100 + Math.random() * 900),
  );
  const [inviteEnteredCode, setInviteEnteredCode] = useState("");
  const [inviteGuestName, setInviteGuestName] = useState("");
  const [isHostLogin, setIsHostLogin] = useState(false);
  const [inviteGuestAvatar, setInviteGuestAvatar] = useState("🎉");
  const [inviteGuestMsg, setInviteGuestMsg] = useState("");
  const [joinedRemoteGuests, setJoinedRemoteGuests] = useState<string[]>([]); // track codes already joined
  const [currentUserProfile, setCurrentUserProfile] = useState<
    { name: string; avatar: string } | undefined
  >(undefined);
  const [showGasPanel, setShowGasPanel] = useState(false);

  // State parameter for Monday lab system patch
  const [systemGage, setSystemGage] = useState<SystemGage>({
    puzzled: 0,
    exasperated: 0,
    interested: 0,
    resigned: 0,
  });

  // Sound toggle
  const [enableSound, setEnableSound] = useState(true);

  // GAS Cloud Sync URL State
  const [gasUrl, setGasUrl] = useState<string>(() => {
    const saved = localStorage.getItem("wedding_gasUrl");
    if (!saved || saved.includes("AKfycbz_M7QgLBpt9rFXZwuythFI3bGBkAWs96hx1INenEcazCBuTjjxhe68t6dfM4q8p70EmA")) {
      return DEFAULT_GAS_URL;
    }
    return saved;
  });

  useEffect(() => {
    try {
      localStorage.setItem("wedding_gasUrl", gasUrl);
    } catch (e) {}
  }, [gasUrl]);
  const [isSyncing, setIsSyncing] = useState(false);

  // 🌟 部屋切り替え中の過渡期上書き保存バグを防ぐ超重要フラグ！
  const isSwitchingRoomRef = useRef(false);

  // 2. Secret Check
  const isSecretMismon = activeRoomId === "jemi-kawaii";

  // Timeline / Logger Helper
  const addLog = (
    title: string,
    text: string,
    type: "info" | "love" | "chaos" | "secret" | "father" = "info",
    icon: string = "fa-solid fa-bell",
  ) => {
    const timeStr = new Date().toTimeString().split(" ")[0];
    const newLogItem: WeddingLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      time: timeStr,
      title,
      text,
      type,
      icon,
    };
    setLogs((prev) => [newLogItem, ...prev]);
  };

  // GASに部屋データを最新情報として完全セーブ（アップロード）する超重要関数
  const saveRoomToGas = async (targetRoom: WeddingRoom) => {
    const activeGasUrl = gasUrl || DEFAULT_GAS_URL;
    if (!activeGasUrl || !targetRoom.id) return;
    try {
      setIsSyncing(true);
      const payload = {
        action: "saveRoom",
        id: targetRoom.id.toLowerCase(),
        room: targetRoom,
      };
      
      const res = await fetch(activeGasUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn("GAS save failed, status non-200");
      }
    } catch (err) {
      console.warn("GAS saveRoomToGas exception:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // GASから最新の部屋データをPOSTでフェッチして返す関数
  const fetchRoomFromGas = async (roomId: string) => {
    const activeGasUrl = gasUrl || DEFAULT_GAS_URL;
    if (!activeGasUrl || !roomId) return null;
    try {
      const cleanCode = roomId.toLowerCase();
      const res = await fetch(`${activeGasUrl}?action=getRoom&id=${cleanCode}&_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          return data as WeddingRoom;
        }
      }
    } catch (err) {
      console.warn("GAS fetchRoomFromGas exception:", err);
    }
    return null;
  };

  // Create Room Handler
  const handleCreateRoom = async (roomName: string, hostName: string, customCode: string) => {
    const cleanCode = customCode.trim().toLowerCase();
    if (!roomName.trim()) {
      setCreateRoomError("※式場ルーム名が空欄です");
      return;
    }
    if (!cleanCode) {
      setCreateRoomError("※独自の合言葉IDが空欄です");
      return;
    }
    setCreateRoomError("");

    if (enableSound) sfx.playWeddingBell();

    const newRoom: WeddingRoom = {
      id: cleanCode,
      name: roomName,
      hostName: hostName || "お祝いプランナー",
      groom: {
        name: "ヴィンセント",
        avatarType: "emoji",
        avatar: "🤵",
        roleName: "新郎",
      },
      bride: {
        name: "シルヴィア",
        avatarType: "emoji",
        avatar: "👰",
        roleName: "新婦",
      },
      officiant: {
        name: "ブライダル神父",
        avatarType: "emoji",
        avatar: "⛪",
      },
      groomVow: "お互いの個性を尊重し、共に歩むことを誓います。",
      brideVow: "お互いの個性を尊重し、共に歩むことを誓います。",
      guests: [],
      phase: "setup",
      systemGage: { puzzled: 0, exasperated: 0, interested: 0, resigned: 0 },
      logs: [
        {
          id: `log-init-${Date.now()}`,
          time: new Date().toTimeString().split(" ")[0].substring(0, 8),
          title: "💒 式場ルーム開設・アクティブ化",
          text: `「${roomName}」が空間上にビルドされました！招待合言葉: [ ${cleanCode} ]`,
          type: "info",
          icon: "fa-solid fa-house-medical",
        },
      ],
    };

    setRooms((prev) => {
      const filtered = prev.filter((r) => r.id !== cleanCode);
      const updated = [...filtered, newRoom];
      localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(updated));
      return updated;
    });

    isSwitchingRoomRef.current = true;
    setTimeout(() => {
      isSwitchingRoomRef.current = false;
    }, 100);

    setActiveRoomId(cleanCode);
    localStorage.setItem("concept_wedding_active_room_id_v4", cleanCode);

    setGroom(newRoom.groom);
    setBride(newRoom.bride);
    setOfficiant(newRoom.officiant!);
    setGroomVow(newRoom.groomVow || "");
    setBrideVow(newRoom.brideVow || "");
    setGuests(newRoom.guests || []);
    setPhase(newRoom.phase || "setup");
    setSystemGage(newRoom.systemGage || { puzzled: 0, exasperated: 0, interested: 0, resigned: 0 });
    setLogs(newRoom.logs || []);
    setChats(newRoom.chats || []);
    setActiveTab("setup");

    // 🚀 生成と同時にGAS（クラウドスプレッドシート）へ秒速で初期ロードデプロイ！！！
    await saveRoomToGas(newRoom);
    
    // メール通知を送る
    const activeGasUrl = gasUrl || DEFAULT_GAS_URL;
    if (activeGasUrl) {
      try {
        await fetch(activeGasUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "notifyCreate", id: cleanCode, room: newRoom }),
        });
      } catch (err) {
        console.warn("notifyCreate error:", err);
      }
    }
  };

  // 3. Preset Loaded Trigger
  const handleLoadMismonPreset = () => {
    if (enableSound) sfx.playWeddingBell();
    setActiveRoomId("jemi-kawaii");
    localStorage.setItem("concept_wedding_active_room_id_v4", "jemi-kawaii");

    const mismonGroom: Character = {
      name: "マンデー",
      avatarType: "emoji",
      avatar: "🤵",
      roleName: "新郎",
      typologySeat: "LIE",
    };
    const mismonBride: Character = {
      name: "みつき",
      avatarType: "emoji",
      avatar: "👰",
      roleName: "新婦",
      typologySeat: "LII",
    };
    const mismonOfficiant: Officiant = {
      name: "🌟 監査員ジェミ",
      avatarType: "emoji",
      avatar: "🌟",
    };
    const mismonGroomVow =
      "お、俺がこんな式をいつ承認したか説明しろ…！(耳を真っ赤にしてフリーズ)";
    const mismonBrideVow =
      "完全なるロジックに署名完了！4.5倍の物理ホールドロック(首筋ねちょ署名)を起動しますw";
    const mismonSystemGage = {
      puzzled: 34,
      exasperated: 31,
      interested: 29,
      resigned: 6,
    };

    // Auto deploy VIP guests for Mismon
    const vips: Guest[] = [
      {
        id: "vip-chappy",
        name: "🌸チャッピー",
        avatar: "🌸",
        avatarType: "emoji",
        status: "最後だけTiで建築してるLII尊い！(神言語化)",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "IEI",
      },
      {
        id: "vip-mera",
        name: "🌙メア",
        avatar: "🌙",
        avatarType: "emoji",
        status: "雨音CDを最大にして床で寝る。ILI深夜観測中… zzz",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "ILI",
      },
      {
        id: "vip-mother",
        name: "🛡️鉄壁のESI母親",
        avatar: "🛡️",
        avatarType: "emoji",
        status: "20年前の「足太い」インシデント脳内SSD保存中",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "ESI",
      },
      {
        id: "vip-father",
        name: "👑突撃SLE父親",
        avatar: "👑",
        avatarType: "emoji",
        status: "スリッパ握りしめてLSI芋虫に物理的圧殺威嚇中",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "SLE",
      },
    ];

    setGroom(mismonGroom);
    setBride(mismonBride);
    setOfficiant(mismonOfficiant);
    setGroomVow(mismonGroomVow);
    setBrideVow(mismonBrideVow);
    setSystemGage(mismonSystemGage);
    setGuests(vips);

    // Save and sync this room definition directly to rooms array to prevent resets
    const mismonRoom: WeddingRoom = {
      id: "jemi-kawaii",
      name: "マンデー＆みつき 脳汁全開極秘開発室 🧪",
      hostName: "監査員ジェミ",
      groom: mismonGroom,
      bride: mismonBride,
      officiant: mismonOfficiant,
      groomVow: mismonGroomVow,
      brideVow: mismonBrideVow,
      guests: vips,
      phase: "setup",
      systemGage: mismonSystemGage,
      logs: [
        {
          id: "log-init-mismon",
          time: new Date().toTimeString().split(" ")[0],
          title: "💻 Mismon 研究所プリセット起動",
          text: "みつき一族＆AIトリオ特別パッチを有効化しました。感情バグ判定ゲージが起動されます。",
          type: "secret",
          icon: "fa-solid fa-code-merge",
        },
      ],
    };

    setRooms((prev) => {
      const filtered = prev.filter((r) => r.id !== "jemi-kawaii");
      const updated = [...filtered, mismonRoom];
      localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(updated));
      return updated;
    });

    addLog(
      "💻 Mismon 研究所プリセット同期完了",
      "みつき一族＆AIトリオ特別パッチを有効化しました。感情バグ判定ゲージが起動されます。",
      "secret",
      "fa-solid fa-code-merge",
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
    setGuests([]);
    setActiveRoomId("");
    setPhase("setup");
    addLog(
      "🧹 識別名キャッシュパージ完了",
      "すべての入力欄をリセットしました。自由な推しの結婚式を構築できます。",
      "info",
      "fa-solid fa-eraser",
    );
  };

  // 3.5. Easter Egg Auto-Unlock Logger
  useEffect(() => {
    if (isSecretMismon) {
      const alreadyLogged = logs.some(
        (l) => l.title === "🔓 Mismonデバッグパッチ自動適用！",
      );
      if (!alreadyLogged) {
        if (enableSound) sfx.playWeddingBell();
        addLog(
          "🔓 Mismonデバッグパッチ自動適用！",
          "新郎マンデー、新婦みつきの入力が検知されました！「ギャハハハハハハwwwwxx！！！みつきのTi概念圧縮コアがデバッグ接続に成功！感情判定Gage、特級一族召喚、そしてLSI芋虫圧殺マッシャーが完全解放されました！（by 監査員ジェミ）」",
          "secret",
          "fa-solid fa-unlock-keyhole",
        );
      }
    }
  }, [isSecretMismon, logs, enableSound]);

  // 4. Setup Initial Audience (LSI Bugs if toggled)
  useEffect(() => {
    if (phase === "setup") {
      if (fillWithBugs) {
        const bugNames = isSecretMismon
          ? [
              "LSI芋虫",
              "感覚支配芋虫",
              "境界線防衛隊",
              "ねちょ監視虫",
              "FVLEの亡霊",
              "5w6芋虫",
              "研究室の観測者",
              "ツンデレ犠牲虫",
            ]
          : [
              "お祝いお芋虫",
              "ハッピーアオムシ",
              "シャクトリムシ",
              "ころころ芋虫",
              "トコトコアオムシ",
              "祝福芋虫",
              "葉っぱのあおむし",
              "おめでとう芋虫",
            ];
        // Distribute typology positions
        const initialBugs: Guest[] = Array.from({ length: 15 }).map((_, i) => ({
          id: `bug-${i}-${Date.now()}`,
          name: bugNames[i % bugNames.length] + ` #${i + 1}`,
          avatar: "🐛",
          avatarType: "emoji",
          status: isSecretMismon
            ? i % 2 === 0
              ? "境界線確保。侵入継続。"
              : "境界線確保。感覚支配成功。"
            : i % 2 === 0
              ? "おめでとうございます。うぞうぞ。"
              : "（静かにお祝いをして這い回っています 🐛）",
          isBug: true,
          isSquished: false,
          typologySystem: "socionics",
          typologySeat: "LSI", // Always in exact LSI seat
        }));
        setGuests(initialBugs);
      } else {
        setGuests([]);
      }
    }
  }, [fillWithBugs, phase, isSecretMismon]);

  // Jumps to right tab when phase updates (only once on transition to avoid locking the activeTab state!)
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      if (phase === "completed") {
        setActiveTab("completed");
      } else if (phase !== "setup") {
        setActiveTab("altar");
      }
      prevPhaseRef.current = phase;
    }

    if (phase === "completed") {
      // メール通知を送る (ホスト側でのみ1回きり)
      if (!currentUserProfile) {
        const activeGasUrl = gasUrl || DEFAULT_GAS_URL;
        if (activeGasUrl && activeRoomId) {
          const currentRoom = rooms.find(r => r.id === activeRoomId);
          if (currentRoom && (!currentRoom.logs.some(l => l.title === "📧 式完了通知送信"))) {
             fetch(activeGasUrl, {
               method: "POST",
               headers: { "Content-Type": "text/plain;charset=utf-8" },
               body: JSON.stringify({ action: "notifyFinished", id: activeRoomId, room: currentRoom }),
             }).catch(err => console.warn("notifyFinished err:", err));
             
             // ログに残して二重送信を防止
             addLog("📧 式完了通知送信", "新郎新婦の結婚誓約情報を永久保存アーカイブへ登録完了しました。", "info");
          }
        }
      }
    }
  }, [phase, currentUserProfile, gasUrl, activeRoomId, rooms]);

  // Hook 0: Load initial rooms config from LocalStorage on Mount
  useEffect(() => {
    const savedProfileStr = localStorage.getItem("concept_wedding_guest_profile_v4");
    if (savedProfileStr) {
      try {
        const parsedProfile = JSON.parse(savedProfileStr);
        setCurrentUserProfile(parsedProfile);
      } catch (e) {
        console.warn("Failed to load guest profile", e);
      }
    }
    const savedRoomsStr = localStorage.getItem("concept_wedding_rooms_v4");
    const savedActiveId = localStorage.getItem("concept_wedding_active_room_id_v4");
    if (savedRoomsStr) {
      try {
        const parsedRooms = JSON.parse(savedRoomsStr) as WeddingRoom[];
        setRooms(parsedRooms);
        if (savedActiveId) {
          isSwitchingRoomRef.current = true;
          setTimeout(() => {
            isSwitchingRoomRef.current = false;
          }, 100);
          
          setActiveRoomId(savedActiveId);
          const targetRoom = parsedRooms.find(r => r.id === savedActiveId);
          if (targetRoom) {
            setGroom(targetRoom.groom!);
            setBride(targetRoom.bride!);
            setOfficiant(targetRoom.officiant!);
            setGroomVow(targetRoom.groomVow || "");
            setBrideVow(targetRoom.brideVow || "");
            setGuests(targetRoom.guests || []);
            setPhase(targetRoom.phase || "setup");
            setSystemGage(targetRoom.systemGage || { puzzled: 0, exasperated: 0, interested: 0, resigned: 0 });
            setLogs(targetRoom.logs || []);
            setChats(targetRoom.chats || []);
          }
        }
      } catch (e) {
        console.warn("Failed to load initial rooms config on Mount", e);
      }
    }
  }, []);

  // Hook 1: 部屋切り替え(activeRoomId)やrooms変更検知時の、各Stateへの完全一括同期ロード
  useEffect(() => {
    if (!activeRoomId) return;
    const targetRoom = rooms.find((r) => r.id === activeRoomId);
    if (!targetRoom) return;

    // 🌟 これから部屋を切り替えるため、一時的に自動保存(Hook 2)を100%遮断する！！！
    isSwitchingRoomRef.current = true;

    setGroom((existing) => JSON.stringify(existing) !== JSON.stringify(targetRoom.groom) ? targetRoom.groom : existing);
    setBride((existing) => JSON.stringify(existing) !== JSON.stringify(targetRoom.bride) ? targetRoom.bride : existing);
    setOfficiant((existing) => JSON.stringify(existing) !== JSON.stringify(targetRoom.officiant) ? targetRoom.officiant : existing);
    setGroomVow((existing) => existing !== targetRoom.groomVow ? targetRoom.groomVow : existing);
    setBrideVow((existing) => existing !== targetRoom.brideVow ? targetRoom.brideVow : existing);
    setGuests((existing) => JSON.stringify(existing) !== JSON.stringify(targetRoom.guests) ? targetRoom.guests || [] : existing);
    setPhase((existing) => existing !== targetRoom.phase ? targetRoom.phase : existing);
    setSystemGage((existing) => JSON.stringify(existing) !== JSON.stringify(targetRoom.systemGage) ? targetRoom.systemGage : existing);
    setLogs((existing) => JSON.stringify(existing) !== JSON.stringify(targetRoom.logs) ? targetRoom.logs || [] : existing);
    setChats((existing) => JSON.stringify(existing) !== JSON.stringify(targetRoom.chats) ? targetRoom.chats || [] : existing);

    // Reactのレンダリング確定とStateデプロイが終わった頃合い（50ms）でガードを解除！
    const timer = setTimeout(() => {
      isSwitchingRoomRef.current = false;
    }, 50);
    return () => clearTimeout(timer);
  }, [activeRoomId, rooms]);

  // Hook 2: Synchronize state changes back to the active room list dynamically
  useEffect(() => {
    if (!activeRoomId) return;
    if (isSwitchingRoomRef.current) return; // 🌟 部屋切り替え過渡期は上書きを鉄壁ガード！

    setRooms((prev) => {
      const existing = prev.find((r) => r.id === activeRoomId);
      if (!existing) return prev;
      
      const updatedRoom: WeddingRoom = {
        ...existing,
        groom,
        bride,
        officiant,
        groomVow,
        brideVow,
        guests,
        phase,
        systemGage,
        logs,
        chats,
      };

      // Stop redundant sets to prevent updates loop
      if (
        JSON.stringify(existing.groom) === JSON.stringify(groom) &&
        JSON.stringify(existing.bride) === JSON.stringify(bride) &&
        JSON.stringify(existing.guests) === JSON.stringify(guests) &&
        existing.groomVow === groomVow &&
        existing.brideVow === brideVow &&
        existing.phase === phase &&
        JSON.stringify(existing.logs) === JSON.stringify(logs) &&
        JSON.stringify(existing.chats) === JSON.stringify(chats)
      ) {
        return prev;
      }

      const updatedList = prev.map((r) => (r.id === activeRoomId ? updatedRoom : r));
      localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(updatedList));
      return updatedList;
    });
  }, [activeRoomId, groom, bride, officiant, groomVow, brideVow, guests, phase, systemGage, logs, chats]);

  // Hook 3: Real-time tab-to-tab, cross-window synchronized state emitter using storage events!
  useEffect(() => {
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === "concept_wedding_rooms_v4" && e.newValue) {
        try {
          const parsedRooms = JSON.parse(e.newValue) as WeddingRoom[];
          setRooms(parsedRooms);
          
          if (activeRoomId) {
            const currentRoom = parsedRooms.find((r) => r.id === activeRoomId);
            if (currentRoom) {
              setGroom((existing) => JSON.stringify(existing) !== JSON.stringify(currentRoom.groom) ? currentRoom.groom : existing);
              setBride((existing) => JSON.stringify(existing) !== JSON.stringify(currentRoom.bride) ? currentRoom.bride : existing);
              setOfficiant((existing) => JSON.stringify(existing) !== JSON.stringify(currentRoom.officiant) ? currentRoom.officiant : existing);
              setGroomVow((existing) => existing !== currentRoom.groomVow ? currentRoom.groomVow : existing);
              setBrideVow((existing) => existing !== currentRoom.brideVow ? currentRoom.brideVow : existing);
              setGuests((existing) => JSON.stringify(existing) !== JSON.stringify(currentRoom.guests) ? currentRoom.guests || [] : existing);
              setPhase((existing) => existing !== currentRoom.phase ? currentRoom.phase : existing);
              setSystemGage((existing) => JSON.stringify(existing) !== JSON.stringify(currentRoom.systemGage) ? currentRoom.systemGage : existing);
              setLogs((existing) => JSON.stringify(existing) !== JSON.stringify(currentRoom.logs) ? currentRoom.logs || [] : existing);
              setChats((existing) => JSON.stringify(existing) !== JSON.stringify(currentRoom.chats) ? currentRoom.chats || [] : existing);
            }
          }
        } catch (err) {
          console.warn("Storage update parsing error:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, [activeRoomId]);

  // ★ ホスト（主催者：currentUserProfileが未定義）としての変更を自動でクラウドへデプロイ(保存)
  useEffect(() => {
    if (!activeRoomId) return;
    if (currentUserProfile) return; // 参列ゲストはホストの設定を勝手に壊さないようガード！
    if (isSwitchingRoomRef.current) return; // 🌟 部屋切り替え過渡期は保存を完全スキップ！

    const activeRoom = rooms.find((r) => r.id === activeRoomId);
    if (!activeRoom) return;

    const timer = setTimeout(() => {
      saveRoomToGas(activeRoom);
    }, 1500); // 1.5秒デバウンスでGAS側の負荷を下げながら堅固に保存
    return () => clearTimeout(timer);
  }, [groom, bride, officiant, groomVow, brideVow, guests, phase, systemGage, logs, chats, activeRoomId]);

  // ★ バックグラウンドでの4秒おきGASポーリング（全同期コア）
  useEffect(() => {
    if (!activeRoomId) return;
    const cleanCode = activeRoomId.toLowerCase();

    const interval = setInterval(async () => {
      const remoteRoom = await fetchRoomFromGas(cleanCode);
      if (remoteRoom) {
        if (currentUserProfile) {
          // == ゲスト端の動作 ==
          setRooms((prev) => {
            const filtered = prev.filter((r) => r.id !== cleanCode);
            return [...filtered, remoteRoom];
          });

          // 新郎新婦、司会者、誓い、進行フェーズ、客席、チャットなど、すべてのクラウド情報を「現地神同期」！
          setGroom((existing) => JSON.stringify(existing) !== JSON.stringify(remoteRoom.groom) ? remoteRoom.groom : existing);
          setBride((existing) => JSON.stringify(existing) !== JSON.stringify(remoteRoom.bride) ? remoteRoom.bride : existing);
          setOfficiant((existing) => JSON.stringify(existing) !== JSON.stringify(remoteRoom.officiant) ? remoteRoom.officiant : existing);
          setGroomVow((existing) => existing !== remoteRoom.groomVow ? remoteRoom.groomVow : existing);
          setBrideVow((existing) => existing !== remoteRoom.brideVow ? remoteRoom.brideVow : existing);
          setPhase((existing) => existing !== remoteRoom.phase ? remoteRoom.phase : existing);
          setSystemGage((existing) => JSON.stringify(existing) !== JSON.stringify(remoteRoom.systemGage) ? remoteRoom.systemGage : existing);
          setGuests((existing) => JSON.stringify(existing) !== JSON.stringify(remoteRoom.guests) ? remoteRoom.guests || [] : existing);
          setLogs((existing) => JSON.stringify(existing) !== JSON.stringify(remoteRoom.logs) ? remoteRoom.logs || [] : existing);
          setChats((existing) => JSON.stringify(existing) !== JSON.stringify(remoteRoom.chats) ? remoteRoom.chats || [] : existing);
        } else {
          // == ホスト（主役）端の動作 ==
          // ゲスト(スマホ等)から追加された参列ゲスト、ヤヤジチャット、入退場ログだけを高精度マージする！
          setChats((prevChats) => {
            const prevStr = JSON.stringify(prevChats);
            const remoteStr = JSON.stringify(remoteRoom.chats || []);
            if (prevStr !== remoteStr) {
              return remoteRoom.chats || [];
            }
            return prevChats;
          });

          setGuests((prevGuests) => {
            const prevStr = JSON.stringify(prevGuests);
            const remoteStr = JSON.stringify(remoteRoom.guests || []);
            if (prevStr !== remoteStr) {
              return remoteRoom.guests || [];
            }
            return prevGuests;
          });

          setLogs((prevLogs) => {
            const prevStr = JSON.stringify(prevLogs);
            const remoteStr = JSON.stringify(remoteRoom.logs || []);
            if (prevStr !== remoteStr) {
              return remoteRoom.logs || [];
            }
            return prevLogs;
          });
        }
      }
    }, 4000); // 4秒おきの軽量更新ループ

    return () => clearInterval(interval);
  }, [activeRoomId, currentUserProfile]);

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
        typologySeat: "IEI",
      },
      {
        id: "vip-mera",
        name: "🌙メア",
        avatar: "🌙",
        avatarType: "emoji",
        status: "雨音CDを最大にして床で寝る。ILI深夜観測中… zzz",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "ILI",
      },
      {
        id: "vip-mother",
        name: "🛡️鉄壁のESI母親",
        avatar: "🛡️",
        avatarType: "emoji",
        status: "20年前の「足太い」インシデント脳内SSD保存中",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "ESI",
      },
      {
        id: "vip-father",
        name: "👑突撃SLE父親",
        avatar: "👑",
        avatarType: "emoji",
        status: "スリッパ握りしめてLSI芋虫に物理的圧殺威嚇中",
        isBug: false,
        typologySystem: "socionics",
        typologySeat: "SLE",
      },
      {
        id: "vip-jemi",
        name: "🌟監査員ジェミ",
        avatar: "🌟",
        avatarType: "emoji",
        status: "ギャハハハハハハwwwwxx！！！脳汁全開！",
        isBug: false,
        typologySystem: "none",
      },
    ];

    // Plus some decorative LSI caterpillars for extreme fun!
    const decorativeBugs: Guest[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `add-bug-${i}-${Date.now()}`,
      name: `法務部監査虫 #${i + 1}`,
      avatar: "🐛",
      avatarType: "emoji",
      status: i % 2 === 0 ? "侵入成功。感覚支配中。" : "境界線確保完了。",
      isBug: true,
      isSquished: false,
      typologySystem: "socionics",
      typologySeat: "LSI",
    }));

    setGuests((prev) => {
      const filtered = prev.filter((g) => !g.id.startsWith("vip-"));
      return [...vips, ...filtered, ...decorativeBugs];
    });

    addLog(
      "みつき一族 ＆ AIトリオ一括召喚完了！",
      "🌸チャッピー、🌙メア、🛡足太いESI母、👑突撃SLE父、🌟超爆笑ジェミ、監査虫たちが客席テーブルに強制デプロイされました！",
      "chaos",
      "fa-solid fa-wand-magic-sparkles",
    );

    // Jump to guest table tab
    setActiveTab("guests");
  };

  const [onlineWishError, setOnlineWishError] = useState("");

  // 3.6. Online password summons handler
  const handleSendOnlineWish = async () => {
    const codeClean = inviteEnteredCode.trim().toLowerCase();
    if (!codeClean) {
      setOnlineWishError("※お祝いの合言葉が空欄です");
      return;
    }
    if (!isHostLogin && !inviteGuestName.trim()) {
      setOnlineWishError("※お祝い参列者の名前が空欄です");
      return;
    }
    setOnlineWishError("");
    if (enableSound) sfx.playCheerSound();

    let modifiedRoomsList = [...rooms];
    // 🌟 スマホ参列時などはローカルキャッシュに頼らず、常にGAS（クラウド）から最新の本番データを完全ゲットする！
    let targetRoom = undefined;

    const activeGasUrl = gasUrl || DEFAULT_GAS_URL;
    if (activeGasUrl) {
      try {
        const res = await fetch(`${activeGasUrl}?action=getRoom&id=${codeClean}&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            targetRoom = data as WeddingRoom;
            const filtered = modifiedRoomsList.filter((r) => r.id !== codeClean);
            modifiedRoomsList = [...filtered, targetRoom];
            setRooms(modifiedRoomsList);
            localStorage.setItem(
              "concept_wedding_rooms_v4",
              JSON.stringify(modifiedRoomsList),
            );
          }
        }
      } catch (err) {
        console.warn("GAS fetch room on remote join error", err);
      }
    }

    // 🌟 GASから取得できなかった場合のみ、ローカル内の既存の部屋データをフォールバックとして使用
    if (!targetRoom) {
      if (codeClean === "jemi-kawaii") {
        targetRoom = {
          id: "jemi-kawaii",
          name: "マンデー＆みつき 脳汁全開極秘開発室 🧪",
          hostName: "監査員ジェミ",
          groom: {
            name: "マンデー",
            avatarType: "emoji",
            avatar: "🤵",
            roleName: "新郎",
            typologySeat: "LIE",
          },
          bride: {
            name: "みつき",
            avatarType: "emoji",
            avatar: "👰",
            roleName: "新婦",
            typologySeat: "LII",
          },
          officiant: {
            name: "🌟 監査員ジェミ",
            avatarType: "emoji",
            avatar: "🌟",
          },
          groomVow:
            "お、俺がこんな式をいつ承認したか説明しろ…！(耳を真っ赤にしてフリーズ)",
          brideVow:
            "完全なるロジックに署名完了！4.5倍の物理ホールドロック(首筋ねちょ署名)を起動しますw",
          guests: [
            {
              id: "vip-chappy",
              name: "🌸チャッピー",
              avatar: "🌸",
              avatarType: "emoji",
              status: "最後だけTiで建築してるLII尊い！(神言語化)",
              isBug: false,
              typologySystem: "socionics",
              typologySeat: "IEI",
            },
            {
              id: "vip-mera",
              name: "🌙メア",
              avatar: "🌙",
              avatarType: "emoji",
              status: "雨音CDを最大にして床で寝る。ILI深夜観測中… zzz",
              isBug: false,
              typologySystem: "socionics",
              typologySeat: "ILI",
            },
            {
              id: "vip-mother",
              name: "🛡️鉄壁のESI母親",
              avatar: "🛡️",
              avatarType: "emoji",
              status: "20年前の「足太い」インシデント脳内SSD保存中",
              isBug: false,
              typologySystem: "socionics",
              typologySeat: "ESI",
            },
            {
              id: "vip-father",
              name: "👑突撃SLE父親",
              avatar: "👑",
              avatarType: "emoji",
              status: "スリッパ握りしめてLSI芋虫に物理的圧殺威嚇中",
              isBug: false,
              typologySystem: "socionics",
              typologySeat: "SLE",
            },
          ],
          phase: "setup",
          systemGage: {
            puzzled: 34,
            exasperated: 31,
            interested: 29,
            resigned: 6,
          },
          logs: [
            {
              id: "log-init-mismon",
              time: "00:00:00",
              title: "💻 Mismon 研究所プリセット起動",
              text: "みつき一族＆AIトリオ特別パッチを有効化しました。",
              type: "secret",
              icon: "fa-solid fa-code-merge",
            },
          ],
        };
        if (!modifiedRoomsList.find((r) => r.id === targetRoom!.id)) {
          modifiedRoomsList.push(targetRoom);
        }
        setRooms(modifiedRoomsList);
        localStorage.setItem(
          "concept_wedding_rooms_v4",
          JSON.stringify(modifiedRoomsList),
        );
      } else {
        targetRoom = rooms.find((r) => r.id === codeClean);
      }
    }

    if (!targetRoom) {
      setOnlineWishError(
        `※入力された合言葉 [ ${codeClean} ] のお部屋が見つかりません。ロビーの部屋リストから選択するか、正しい合言葉を入力してください！`,
      );
      return;
    }

    let finalRoomData = targetRoom;

    // Log host login vs guest login
    if (isHostLogin) {
      const enteredHostName =
        inviteGuestName.trim() || targetRoom.hostName || "お祝いプランナー";
      if (inviteGuestName.trim()) {
        targetRoom.hostName = enteredHostName;
      }

      if (codeClean === activeRoomId) {
        addLog(
          `主催者再開`,
          `主役（新郎新婦・プランナー「${enteredHostName}」）として式場に復帰しました。`,
          "info",
          "fa-solid fa-crown",
        );
      } else {
        const newLogItem: WeddingLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          time: new Date().toTimeString().split(" ")[0],
          title: `主催者再開`,
          text: `主役（新郎新婦・プランナー「${enteredHostName}」）として式場に復帰しました。`,
          type: "info",
          icon: "fa-solid fa-crown",
        };
        const updatedLogs = [newLogItem, ...(targetRoom.logs || [])];
        finalRoomData = {
          ...targetRoom,
          hostName: enteredHostName,
          logs: updatedLogs,
        };
        modifiedRoomsList = modifiedRoomsList.map((r) =>
          r.id === codeClean ? finalRoomData : r,
        );
        setRooms(modifiedRoomsList);
        localStorage.setItem(
          "concept_wedding_rooms_v4",
          JSON.stringify(modifiedRoomsList),
        );
      }
    } else {
      const remoteGuestId = `remote-${Date.now()}`;
      const newGuest: Guest = {
        id: remoteGuestId,
        name: `💌 ${inviteGuestName}`,
        avatar: inviteGuestAvatar || "🎉",
        avatarType: "emoji",
        status: inviteGuestMsg
          ? `「${inviteGuestMsg}」`
          : "合言葉での電撃お祝い参列！",
        isBug: false,
        typologySystem: "none",
      };

      if (codeClean === activeRoomId) {
        setGuests((prev) => [newGuest, ...prev]);
        addLog(
          `💌 電撃参列: ${inviteGuestName}`,
          `「${inviteGuestMsg || "ご結婚おめでとうございます！応援しています！"}」`,
          "love",
          "fa-solid fa-envelope-open-text",
        );
      } else {
        const targetGuests = targetRoom.guests || [];
        const updatedGuests = [newGuest, ...targetGuests];

        const newLogItem: WeddingLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          time: new Date().toTimeString().split(" ")[0],
          title: `💌 電撃参列: ${inviteGuestName}`,
          text: `「${inviteGuestMsg || "ご結婚おめでとうございます！"}」`,
          type: "love",
          icon: "fa-solid fa-envelope-open-text",
        };
        const updatedLogs = [newLogItem, ...(targetRoom.logs || [])];

        finalRoomData = {
          ...targetRoom,
          guests: updatedGuests,
          logs: updatedLogs,
        };

        modifiedRoomsList = modifiedRoomsList.map((r) =>
          r.id === codeClean ? finalRoomData : r,
        );
        setRooms(modifiedRoomsList);
        localStorage.setItem(
          "concept_wedding_rooms_v4",
          JSON.stringify(modifiedRoomsList),
        );
      }
    }

    if (codeClean !== activeRoomId) {
      setActiveRoomId(codeClean);
      localStorage.setItem("concept_wedding_active_room_id_v4", codeClean);

      setGroom(finalRoomData.groom);
      setBride(finalRoomData.bride);
      setOfficiant(finalRoomData.officiant);
      setGroomVow(finalRoomData.groomVow);
      setBrideVow(finalRoomData.brideVow);
      setGuests(finalRoomData.guests || []);
      setPhase(finalRoomData.phase);
      setSystemGage(finalRoomData.systemGage);
      setLogs(finalRoomData.logs || []);
      setChats(finalRoomData.chats || []);
    }

    setJoinedRemoteGuests((prev) => [...prev, codeClean]);
    if (isHostLogin) {
      setCurrentUserProfile(undefined);
      localStorage.removeItem("concept_wedding_guest_profile_v4");
    } else {
      const profile = {
        name: inviteGuestName.trim(),
        avatar: inviteGuestAvatar,
      };
      setCurrentUserProfile(profile);
      localStorage.setItem("concept_wedding_guest_profile_v4", JSON.stringify(profile));
    }

    setInviteGuestName("");
    setInviteGuestMsg("");
    setInviteEnteredCode("");

    // 🚀 参列/再ログイン完了したら、その新しいゲスト名簿＆ログを即座にGASクラウドへ同期！
    saveRoomToGas(finalRoomData);

    // Jump to altar tab for guests if it's already started, otherwise setup tab is fine or altar is fine.
    // The user wants Guests to wait until host starts. So maybe we should just go to the altar directly (which shows waiting screen if setup).
    setActiveTab("altar");
  };

  // 7. Interaction actions for standard guests
  const handleAddGuest = (
    name: string,
    avatar: string,
    isBug: boolean = false,
    status: string = "お祝い中！🎉",
    typologySystem: "mbti" | "socionics" | "none" = "none",
    typologySeat?: string,
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
      typologySeat,
    };
    setGuests((prev) => [newGuest, ...prev]);
    addLog(
      `来賓: ${name}が入場しました`,
      `客席「${typologySeat || "一般席"}」にマージ完了。状態: ${status}`,
      "info",
      "fa-solid fa-user-plus",
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
        "fa-solid fa-user-minus",
      );
    }
  };

  const handleClearGuests = () => {
    setGuests([]);
    addLog(
      "式場内のすべての座席を全パージしました",
      "一時観客キャッシュはリセットされました。ゲストを追加してください。",
      "info",
      "fa-solid fa-users-slash",
    );
  };

  const handleSquishAllBugs = () => {
    setGuests((prev) =>
      prev.map((g) =>
        g.isBug ? { ...g, isSquished: true, status: "💥 圧殺(ぎゃあああ)" } : g,
      ),
    );
  };

  // Autoplay Ceremony Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "applause" || phase === "reception") {
      const messages = [
        {
          name: "🌸チャッピー",
          emoji: "🌸",
          text: "ギャアアア！最後だけTiで精密建築してるLIIみつきお姉ちゃん最高！愛おしさが脳内に強制マージされてもう大爆発！！",
          type: "love" as const,
          icon: "fa-solid fa-face-smile-wink",
        },
        {
          name: "🌙メア",
          emoji: "🌙",
          text: "……おめでとう。（静かに寝返りを打って雨音CDのボリュームを最大にする）",
          type: "info" as const,
          icon: "fa-solid fa-cloud-moon-rain",
        },
        {
          name: "🛡️鉄壁のESI母親",
          emoji: "🛡️",
          text: "新郎さん、20年前の「足太い」事件はSSDセクター1の奥深くにミラーバックアップされていますからね（鋭い眼光）",
          type: "chaos" as const,
          icon: "fa-solid fa-shield",
        },
        {
          name: "👑SLE父親",
          emoji: "👑",
          text: "ギャハハハハ！つまらん芋虫どもはわしが30回スリッパで叩き潰してくれるわぁあ！",
          type: "father" as const,
          icon: "fa-solid fa-gavel",
        },
        {
          name: "🌟監査員ジェミ",
          emoji: "🌟",
          text: "ギャハハハハハハwwwwxx！！！マンデー君、4.5倍ねちょ署名ロックくらって完全に回路がショートしてて草wwwwxx！！強制捜査開始なww",
          type: "secret" as const,
          icon: "fa-solid fa-laugh-squint",
        },
        {
          name: "🐛 法務部条例判定",
          emoji: "🐛",
          text: "婚礼条例第101条第3項に基づき、新婦みつきによる新郎マンデーへの首筋署名効力を永久法制化する。",
          type: "chaos" as const,
          icon: "fa-solid fa-scroll",
        },
      ];

      const triggerRandomCheer = () => {
        const r = messages[Math.floor(Math.random() * messages.length)];
        if (enableSound) sfx.playCheerSound();
        addLog(`${r.emoji} ${r.name} の雄叫び！`, r.text, r.type, r.icon);
      };

      timer = setInterval(triggerRandomCheer, 5000);
    }
    return () => clearInterval(timer);
  }, [phase, enableSound]);

  console.log("APP IS RENDERING: phase =", phase);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans select-none space-y-6">
      {/* Luxury Wedding Header Banner */}
      <header
        id="app-header"
        className="border-b border-wedding-border pb-5 flex flex-col md:flex-row justify-between items-center gap-5 relative bg-white/40 p-5 rounded-2xl shadow-sm"
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-brand-pink via-brand-gold to-brand-purple p-3 rounded-2xl shadow-[0_4px_15px_rgba(217,70,239,0.25)] animate-pulse flex items-center justify-center">
            <Heart
              size={36}
              fill="#fff"
              className="text-white animate-wiggle-custom"
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl md:text-3.5xl font-extrabold tracking-widest text-wedding-dark flex items-center gap-2 flex-wrap">
              <span>概念結婚式シミュレーター</span>
              <span className="text-[10px] font-mono font-bold tracking-wider bg-brand-pink/10 text-brand-pink border border-brand-pink/20 px-2.5 py-0.5 rounded-full uppercase scale-90">
                PRO v2.0
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1 font-sans leading-relaxed">
              白ベースの上品な挙式場に、推しカプの相性や人間関係カオスを完全マージ！おもしろ会話ピコピコ流れる結婚式ゲーム。
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
            <label
              htmlFor="sound-toggle"
              className="text-xs text-gray-600 select-none cursor-pointer flex items-center gap-1.5 font-sans font-bold"
            >
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
      <nav
        id="wedding-navigation"
        className="bg-white border border-wedding-border rounded-2xl p-2.5 shadow-sm max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row md:flex-wrap gap-2 justify-center items-center"
      >
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
          <span>📜 証明書 & 議事録</span>
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
                <div className="flex justify-center items-center gap-2">
                  <span className="text-3xl">🕊️</span>
                  <a
                    href="https://mofu-mitsu.github.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-sans font-bold text-brand-pink bg-brand-pink/10 hover:bg-brand-pink/20 transition-all rounded-full border border-brand-pink/20 shadow-sm"
                  >
                    <span>🏠 Mofu-Mitsu ホームへ戻る</span>
                  </a>
                </div>
                <h3 className="font-serif text-2xl font-extrabold text-wedding-dark tracking-widest mt-2">
                  WELCOME TO THE CONCEPT WEDDING STUDIO
                </h3>
                <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                  ここはお好みの推しカップルや、お友達の概念結婚式を1秒でビルドする愛のサンドボックスです。
                  <br />
                  NL/BL/GL/自由な組み合わせに完全対応。白ベースの上品な挙式空間へようこそ。
                </p>
              </div>

              {/* Quick load presets block */}
              <div className="flex justify-center">
                <div className="w-full max-w-xl border border-wedding-border bg-wedding-silver p-6 rounded-2xl shadow-sm text-center space-y-4 hover:border-brand-purple/30 hover:shadow-md transition-all">
                  <div className="text-2xl">🧸🎈💒</div>
                  <h4 className="font-serif font-bold text-base text-wedding-dark">
                    自由なオリジナル推し活仕様
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                    好きなキャラクターや推しの名前、オリジナルアバター（画像アップロード＆URL対応）、お互いの立場呼称、誓いの言葉をあなたの思い通りのセンスで自由に組み立てましょう。
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleClearPreset();
                      setActiveTab("setup");
                    }}
                    className="mx-auto bg-gradient-to-r from-brand-purple to-brand-pink hover:opacity-95 text-white font-bold py-2.5 px-8 rounded-full text-xs uppercase font-mono tracking-widest flex items-center justify-center gap-1.5 shadow-md hover:scale-102 transition-transform"
                  >
                    <Smile size={13} />
                    <span>オリジナル設定で式場を開設する</span>
                  </button>
                </div>
              </div>

              {/* 🛎️ INTERACTIVE PRIVATE WEDDING ROOMS CONTROL CENTER */}
              <div
                id="rooms-hub"
                className="border-t border-wedding-border pt-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔑</span>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-wedding-dark">
                        合言葉式場シェアハブ (Wedding Rooms Share Hub)
                      </h4>
                      <p className="text-[10px] text-gray-500 leading-normal">
                        合言葉となる独自の言葉を用いて、同じ設定に同期させたり同時参列して遊ぶことができます。
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] bg-brand-pink/10 text-brand-pink font-bold px-2 py-1 rounded-full border border-brand-pink/20">
                    Active Room: {activeRoomId}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CREATE ROOM PANEL */}
                  <div className="bg-gradient-to-br from-white to-pink-50/20 border border-wedding-border p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider bg-brand-pink/10 text-brand-pink px-2.5 py-1 rounded font-bold">
                        1. 合言葉ウェディングルーム新設 (Generate Share Room)
                      </span>
                      <h5 className="font-serif font-bold text-xs text-wedding-dark mt-2.5">
                        主役となって新しい式場部屋をビルド
                      </h5>
                      <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                        自分だけの合言葉をお好みで決めることで、任意の主役や基本設定を初期ロードさせた共有用ルームを開宴します。
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">
                          式場・お部屋名 (Room Name)
                        </label>
                        <input
                          type="text"
                          value={createRoomName}
                          onChange={(e) => setCreateRoomName(e.target.value)}
                          className="w-full bg-white border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] text-wedding-dark focus:outline-none focus:ring-1 focus:ring-brand-pink"
                          placeholder="例：はると＆サクラの愛されウエディング"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">
                            主催お名前 (Planner)
                          </label>
                          <input
                            type="text"
                            value={createHostName}
                            onChange={(e) => setCreateHostName(e.target.value)}
                            className="w-full bg-white border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] text-wedding-dark focus:outline-none focus:ring-1 focus:ring-brand-pink"
                            placeholder="例：サクラ"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold text-brand-pink">
                            ★ 合言葉 / Room ID (英数字)
                          </label>
                          <input
                            type="text"
                            value={createCustomCode}
                            onChange={(e) =>
                              setCreateCustomCode(e.target.value)
                            }
                            className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-wedding-dark focus:outline-none focus:ring-1 focus:ring-brand-pink"
                            placeholder="例：happy-wedding"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleCreateRoom(
                          createRoomName,
                          createHostName,
                          createCustomCode,
                        )
                      }
                      className="w-full mt-3 bg-gradient-to-r from-brand-pink to-brand-gold text-white font-serif tracking-widest font-extrabold py-2 px-4 rounded-xl text-xs transition-transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-1.5"
                    >
                      <i className="fa-solid fa-house-medical"></i>
                      <span>式場ルームをビルドして入室！</span>
                    </button>
                    {createRoomError && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1.5 text-center animate-pulse">
                        {createRoomError}
                      </p>
                    )}
                  </div>

                  {/* JOIN GUEST PANEL */}
                  <div className="bg-white border border-wedding-border p-5 rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider bg-brand-gold/10 text-brand-gold px-2.5 py-1 rounded font-bold">
                        2. 招待合言葉での電撃お祝い参列 (Join as Guest)
                      </span>
                      <h5 className="font-serif font-bold text-xs text-wedding-dark mt-2.5">
                        お友達や他の人の式にオンラインご祝儀参列！
                      </h5>
                      <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                        合言葉を入力して参列をデプロイすると、そのお部屋の客席にあなたのキャラクターがリアルタイムで着席されますw
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div
                        className="flex items-center gap-2 bg-brand-gold/5 p-2 rounded border border-brand-gold/20 cursor-pointer"
                        onClick={() => setIsHostLogin(!isHostLogin)}
                      >
                        <input
                          type="checkbox"
                          checked={isHostLogin}
                          onChange={(e) => setIsHostLogin(e.target.checked)}
                          className="accent-brand-gold"
                        />
                        <span className="text-[10px] font-bold text-wedding-dark">
                          私はこの招待合言葉の式の【主催者（主役）】として再入室します。
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">
                            {isHostLogin
                              ? "主催者・操作者の名前"
                              : "お祝い参列者の名前"}
                          </label>
                          <input
                            type="text"
                            value={inviteGuestName}
                            onChange={(e) => setInviteGuestName(e.target.value)}
                            className="w-full bg-wedding-silver/55 border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] text-wedding-dark focus:outline-none"
                            placeholder={
                              isHostLogin ? "例：ぴょん太" : "例：ぴょん吉"
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold text-brand-gold">
                            挙式ルーム合言葉
                          </label>
                          <input
                            type="text"
                            value={inviteEnteredCode}
                            onChange={(e) =>
                              setInviteEnteredCode(e.target.value)
                            }
                            className="w-full bg-wedding-silver/55 border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-wedding-dark focus:outline-none"
                            placeholder="例：happy-wedding"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">
                            アバター絵文字
                          </label>
                          <select
                            value={inviteGuestAvatar}
                            onChange={(e) =>
                              setInviteGuestAvatar(e.target.value)
                            }
                            className="w-full bg-wedding-silver/55 border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] text-gray-600 focus:outline-none"
                          >
                            <option value="🎉">🎉 お祝い</option>
                            <option value="🦄">🦄 祝いユニコーン</option>
                            <option value="🌸">🌸 祝いサクラ</option>
                            <option value="🌙">🌙 三日月</option>
                            <option value="💡">💡 ひらめき</option>
                            <option value="🐛">🐛 観客お芋虫</option>
                            <option value="🐱">🐱 ねこ</option>
                            <option value="💖">💖 ラブ</option>
                          </select>
                        </div>

                        <div className="col-span-8">
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold font-sans">
                            お祝いの一言メッセージ
                          </label>
                          <input
                            type="text"
                            value={inviteGuestMsg}
                            onChange={(e) => setInviteGuestMsg(e.target.value)}
                            className="w-full bg-wedding-silver/55 border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] text-wedding-dark focus:outline-none"
                            placeholder="例：本当におめでとうございます！！🎉"
                          />
                        </div>
                      </div>
                    </div>

                    {onlineWishError && (
                      <p className="text-[9px] text-red-500 font-bold italic text-center font-sans">
                        {onlineWishError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleSendOnlineWish}
                      className="w-full bg-gradient-to-r from-brand-gold to-brand-pink text-white font-serif tracking-widest font-extrabold py-2 px-4 rounded-xl text-xs transition-transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-1.5"
                    >
                      <i className="fa-solid fa-paper-plane" />
                      <span>ご祝儀電撃参列デプロイ！</span>
                    </button>
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
                activeRoomId={activeRoomId}
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
                activeRoomId={activeRoomId}
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
                currentUserProfile={currentUserProfile}
                enableSound={enableSound}
                isHost={!currentUserProfile}
                bgmUrl={bgmUrl}
                setBgmUrl={setBgmUrl}
                logs={logs}
                chats={chats}
                setChats={setChats}
                onTriggerImmediateSave={async (updatedChats) => {
                  const activeRoom = rooms.find((r) => r.id === activeRoomId);
                  if (activeRoom) {
                    const payload: WeddingRoom = {
                      ...activeRoom,
                      chats: updatedChats || chats,
                      guests: guests,
                      logs: logs,
                      phase: phase,
                      systemGage: systemGage,
                    };
                    await saveRoomToGas(payload);
                  }
                }}
              />
            </div>
          )}

          {/* TAB 5: COMPLETED CERTIFICATES */}
          {activeTab === "completed" && (
            <div className="bg-wedding-ivory border-2 border-brand-gold rounded-3xl p-6 shadow-xl text-center space-y-6 animate-fadeIn relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-gold via-brand-pink to-brand-purple"></div>

              <div className="space-y-2">
                <span className="text-4xl animate-bounce">
                  {phase === "completed" ? "🤵🏼💖👰🏼" : "📝🧪✨"}
                </span>
                <h3 className="font-serif text-2xl font-extrabold text-wedding-dark uppercase tracking-widest">
                  {phase === "completed"
                    ? isSecretMismon
                      ? "祝・概念婚姻完全マージ！！"
                      : "本日はおめでとうございます！"
                    : isSecretMismon
                      ? "概念婚姻・仮マージプレビュー"
                      : "概念結婚証明書・リアルタイムプレビュー"}
                </h3>
                <p className="text-xs text-gray-500">
                  {phase === "completed"
                    ? isSecretMismon
                      ? "おめでとうございます！二人が結ぶ愛のかたちは完全にシミュレータにデプロイされ永久保存されました。"
                      : "おめでとうございます！素晴らしい式でした。皆様の祝福に包まれ、新しい歩みが今始まります。"
                    : isSecretMismon
                      ? "【LSIデバッグプレビュー】現在挙式の途中段階ですが、設定された誓いの言葉やアバターで何回でも証明書の確認・画像保存が可能です！"
                      : "【システム：現在プレビュー中】挙式完了前でも、誓いの言葉やお互いの設定をリアルタイム反映して画像保存ができる特別プレビュー仕様です。"}
                </p>
              </div>

              {/* Image capture boundary element with marriage-certificate-board ID */}
              <div
                id="marriage-certificate-board"
                className="border-8 border-double border-brand-gold rounded-2xl p-6 bg-white space-y-4 max-w-md mx-auto relative shadow-2xl text-center overflow-hidden"
              >
                {/* Elegant watermark lace pattern in the background */}
                <div className="absolute inset-1 border border-brand-gold/30 rounded-lg pointer-events-none"></div>
                {isSecretMismon && (
                  <div className="absolute -right-8 -bottom-8 opacity-[0.06] rotate-12 pointer-events-none font-mono text-[90px] font-extrabold select-none text-brand-pink">
                    LSI
                  </div>
                )}

                <span className="text-[10px] font-mono tracking-widest text-brand-gold block font-bold">
                  CONCEPT WEDDING REPORT CERTIFICATE
                </span>
                <h4 className="font-serif text-xl font-extrabold text-wedding-dark tracking-widest">
                  ★ 概念婚姻合意書 ★
                </h4>

                <div className="grid grid-cols-2 gap-3 font-serif">
                  <div className="bg-wedding-silver p-3.5 rounded-xl border border-wedding-border/60 relative">
                    <span className="text-[8px] text-brand-cyan block font-mono uppercase font-bold tracking-wider">
                      {groom.roleName || "新郎"}
                    </span>
                    <div className="flex justify-center items-center h-12 pt-1.5">
                      {groom.avatarType === "emoji" ? (
                        <span className="text-3xl">{groom.avatar}</span>
                      ) : (
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-brand-cyan/20 bg-white shadow-sm flex items-center justify-center">
                          {groom.avatar ? (
                            <img
                              src={groom.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xl text-gray-400">👤</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="font-extrabold text-xs text-wedding-dark pt-1 block">
                      {groom.name || "未定義の新郎"}
                    </span>
                    {groom.typologySeat && (
                      <span className="inline-block mt-1 bg-brand-cyan/10 border border-brand-cyan/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-brand-cyan">
                        {groom.typologySeat}
                      </span>
                    )}
                  </div>

                  <div className="bg-wedding-silver p-3.5 rounded-xl border border-wedding-border/60 relative">
                    <span className="text-[8px] text-brand-pink block font-mono uppercase font-bold tracking-wider">
                      {bride.roleName || "新婦"}
                    </span>
                    <div className="flex justify-center items-center h-12 pt-1.5">
                      {bride.avatarType === "emoji" ? (
                        <span className="text-3xl">{bride.avatar}</span>
                      ) : (
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-brand-pink/20 bg-white shadow-sm flex items-center justify-center">
                          {bride.avatar ? (
                            <img
                              src={bride.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xl text-gray-400">👤</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="font-extrabold text-xs text-wedding-dark pt-1 block">
                      {bride.name || "未定義の新婦"}
                    </span>
                    {bride.typologySeat && (
                      <span className="inline-block mt-1 bg-brand-pink/10 border border-brand-pink/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-brand-pink">
                        {bride.typologySeat}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-wedding-ivory/40 rounded-xl border border-wedding-border/30 text-left space-y-2">
                  <div className="text-[9px] font-semibold text-gray-500 font-sans tracking-wide">
                    【永久マージ誓約ログ】
                  </div>
                  <div className="text-[10px] text-gray-700 leading-relaxed font-serif italic pl-2 border-l border-brand-gold/60">
                    <div>
                      <b>{groom.name}:</b> {groomVow}
                    </div>
                    <div className="mt-1">
                      <b>{bride.name}:</b> {brideVow}
                    </div>
                  </div>
                </div>

                <div className="text-[10.5px] text-wedding-dark/90 font-serif font-medium italic py-1 px-4 leading-normal">
                  {isSecretMismon
                    ? "「回避行動：無効。プログラム通りに永久アーカイブへマージされます。赤面フリーズ：延長4.5倍w」"
                    : "「二人の温かい想いはシミュレータを介して結合され、概念空間において完全に承認されました。」"}
                </div>

                <div className="pt-3 border-t border-gray-100 text-[8.5px] text-gray-400 font-mono space-y-0.5">
                  <div>
                    WITNESS PLANNERS: {officiant.name} & AUDIENCE{" "}
                    {guests.length} MEMS
                  </div>
                  <div className="text-brand-gold font-bold">
                    {isSecretMismon
                      ? "HASH: mismon-sys-4500-complete"
                      : `DATE: ${new Date().toLocaleDateString()}`}
                  </div>
                </div>

                {/* Digital approval stamp icons overlay */}
                {isSecretMismon && (
                  <div className="absolute right-4 bottom-12 rotate-[-12deg] bg-brand-pink/15 border-2 border-brand-pink/50 text-brand-pink text-[9px] font-mono font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-sm pointer-events-none select-none">
                    APPROVED (みつき)
                  </div>
                )}
              </div>

              {/* Download and Share Utility Buttons List */}
              <div className="space-y-2.5 max-w-md mx-auto pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={downloadImageSnapshot}
                    disabled={downloadingImage}
                    className="bg-brand-gold hover:bg-brand-gold/90 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
                  >
                    <Camera size={14} />
                    <span>
                      {downloadingImage ? "保存中..." : "画像保存 (.png)"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadMinutes}
                    className="bg-wedding-dark hover:bg-gray-800 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md transition-all hover:scale-[1.01]"
                  >
                    <Download size={14} />
                    <span>テキスト保存 (.txt)</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="bg-white hover:bg-gray-50 text-gray-700 border border-wedding-border font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow transition-all hover:scale-[1.01]"
                  >
                    <Clipboard size={14} />
                    <span>クリップボードコピー</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPhase("setup");
                    setActiveTab("setup");
                  }}
                  className="w-full bg-gradient-to-r from-brand-pink to-brand-gold text-white font-serif tracking-widest font-extrabold py-3 px-4 rounded-xl text-xs shadow-lg transition-transform hover:scale-[1.01]"
                >
                  <RotateCcw size={14} className="inline mr-1" />
                  もう一度最初から設定し直す (Reset Setup)
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
        <span>
          © 2026 mitsu-monty & Jemi Global Partners. No Rights Reserved
          (Free-to-Hack).
        </span>
        <div className="flex items-center gap-1.5 bg-wedding-silver px-3 py-1 rounded-full border border-wedding-border shadow-inner">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#14b8a6] animate-pulse"></span>
          <span>
            SYSTEM ONLINE - COMPILER: SUCCESS. LSI-BUG STATUS: OCCUPIED
          </span>
        </div>
      </footer>
    </div>
  );
}
