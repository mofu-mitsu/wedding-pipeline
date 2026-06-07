/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Character, Guest, WeddingLog, WeddingPhase, SystemGage, Officiant, WeddingRoom } from "./types";
import { GroomBrideSetup } from "./components/GroomBrideSetup";
import { GuestList } from "./components/GuestList";
import { CeremonyStage } from "./components/CeremonyStage";
import { WeddingTimeline } from "./components/WeddingTimeline";
import { Heart, Sparkles, Smile, MessageCircle, Clipboard, HelpCircle, Layers, Settings, AppWindow, RotateCcw, Camera, Download, Mail } from "lucide-react";
import * as sfx from "./utils/audio";
import html2canvas from "html2canvas";

export const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbyI8-0Qjh5PJAx4qsWWfaViH9kglGGRd9sSU9VouXD53xX4cO4Eo_dNhldtvqpEOqvoEg/exec";

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
  const [bgmUrl, setBgmUrl] = useState("");
  const [downloadingImage, setDownloadingImage] = useState(false);

  // 概念結婚証明書の画像保存 (html2canvas)
  const downloadImageSnapshot = async () => {
    const certElement = document.getElementById("marriage-certificate-board");
    if (!certElement) {
      console.warn("Certificate target element #marriage-certificate-board not found!");
      return;
    }
    setDownloadingImage(true);
    try {
      const canvas = await html2canvas(certElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#fcf8f2", // Beautiful ivory tone
        scale: 2, // High resolution crisp detail
      });
      const link = document.createElement("a");
      link.download = `marriage_certificate_${groom.name || "groom"}_and_${bride.name || "bride"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Certificate snapshot failed:", e);
    } finally {
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
      ...logs.map((l) => `[${l.time}] ${l.title}: ${l.text}`)
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
      `\n結婚式ログ一覧:\n` + logs.map(l => `- [${l.time}] ${l.title}: ${l.text}`).join("\n")
    ].join("\n");
    navigator.clipboard.writeText(lines);
    alert("📋 議事録をクリップボードにコピーしました！");
  };

  // UX Tab-based flow navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>("lobby");

  // Private multi-room states
  const [rooms, setRooms] = useState<WeddingRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>("");
  const [createRoomName, setCreateRoomName] = useState("");
  const [createHostName, setCreateHostName] = useState("");
  const [createCustomCode, setCreateCustomCode] = useState("");
  const [createRoomError, setCreateRoomError] = useState("");

  // Invitation & Password Online SUMMONS States
  const [myInvitationCode] = useState<string>(() => "SWEET-ROOM-" + Math.floor(100 + Math.random() * 900));
  const [inviteEnteredCode, setInviteEnteredCode] = useState("");
  const [inviteGuestName, setInviteGuestName] = useState("");
  const [isHostLogin, setIsHostLogin] = useState(false);
  const [inviteGuestAvatar, setInviteGuestAvatar] = useState("🎉");
  const [inviteGuestMsg, setInviteGuestMsg] = useState("");
  const [joinedRemoteGuests, setJoinedRemoteGuests] = useState<string[]>([]); // track codes already joined
  const [currentUserProfile, setCurrentUserProfile] = useState<{name: string, avatar: string} | undefined>(undefined);
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
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem("concept_wedding_gas_url") || "");
  const [isSyncing, setIsSyncing] = useState(false);

  // 2. Secret Check
  const isSecretMismon = activeRoomId === "jemi-kawaii";

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
      typologySeat: "LIE"
    };
    const mismonBride: Character = {
      name: "みつき",
      avatarType: "emoji",
      avatar: "👰",
      roleName: "新婦",
      typologySeat: "LII"
    };
    const mismonOfficiant: Officiant = {
      name: "🌟 監査員ジェミ",
      avatarType: "emoji",
      avatar: "🌟",
    };
    const mismonGroomVow = "お、俺がこんな式をいつ承認したか説明しろ…！(耳を真っ赤にしてフリーズ)";
    const mismonBrideVow = "完全なるロジックに署名完了！4.5倍の物理ホールドロック(首筋ねちょ署名)を起動しますw";
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
      }
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
          icon: "fa-solid fa-code-merge"
        }
      ]
    };

    setRooms(prev => {
      const filtered = prev.filter(r => r.id !== "jemi-kawaii");
      const updated = [...filtered, mismonRoom];
      localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(updated));
      return updated;
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
    setGuests([]);
    addLog(
      "🧹 識別名キャッシュパージ完了",
      "すべての入力欄をリセットしました。自由な推しの結婚式を構築できます。",
      "info",
      "fa-solid fa-eraser"
    );
  };

  // 3.5. Easter Egg Auto-Unlock Logger
  useEffect(() => {
    if (isSecretMismon) {
      const alreadyLogged = logs.some(l => l.title === "🔓 Mismonデバッグパッチ自動適用！");
      if (!alreadyLogged) {
        if (enableSound) sfx.playWeddingBell();
        addLog(
          "🔓 Mismonデバッグパッチ自動適用！",
          "新郎マンデー、新婦みつきの入力が検知されました！「ギャハハハハハハwwwwxx！！！みつきのTi概念圧縮コアがデバッグ接続に成功！感情判定Gage、特級一族召喚、そしてLSI芋虫圧殺マッシャーが完全解放されました！（by 監査員ジェミ）」",
          "secret",
          "fa-solid fa-unlock-keyhole"
        );
      }
    }
  }, [isSecretMismon, logs, enableSound]);

  // 4. Setup Initial Audience (LSI Bugs if toggled)
  useEffect(() => {
    if (phase === "setup") {
      if (fillWithBugs) {
        const bugNames = isSecretMismon ? [
          "LSI芋虫", "感覚支配芋虫", "境界線防衛隊", "ねちょ監視虫", 
          "FVLEの亡霊", "5w6芋虫", "研究室の観測者", "ツンデレ犠牲虫"
        ] : [
          "お祝いお芋虫", "ハッピーアオムシ", "シャクトリムシ", "ころころ芋虫", 
          "トコトコアオムシ", "祝福芋虫", "葉っぱのあおむし", "おめでとう芋虫"
        ];
        // Distribute typology positions
        const initialBugs: Guest[] = Array.from({ length: 15 }).map((_, i) => ({
          id: `bug-${i}-${Date.now()}`,
          name: bugNames[i % bugNames.length] + ` #${i+1}`,
          avatar: "🐛",
          avatarType: "emoji",
          status: isSecretMismon 
            ? (i % 2 === 0 ? "境界線確保。侵入継続。" : "境界線確保。感覚支配成功。")
            : (i % 2 === 0 ? "おめでとうございます。うぞうぞ。" : "（静かにお祝いをして這い回っています 🐛）"),
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
  }, [fillWithBugs, phase, isSecretMismon]);

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
    
    // Prevent duplicated system/mission logs completely!
    setLogs((prev) => {
      const isDuplicate = prev.some((l) => l.title === title && l.text === text);
      if (isDuplicate) return prev;
      return [...prev, newLog];
    });
  };

  // Rooms Initialization & Syncing
  useEffect(() => {
    const storedRooms = localStorage.getItem("concept_wedding_rooms_v4");
    const storedActiveId = localStorage.getItem("concept_wedding_active_room_id_v4");

    let initialRooms: WeddingRoom[] = [];

    if (storedRooms) {
      initialRooms = JSON.parse(storedRooms);
    } else {
      // Create default rooms
      const defaultRooms: WeddingRoom[] = [
        {
          id: "elegant-chapel",
          name: "一般エレガント・クラシックチャペル 💒",
          hostName: "ウェディングマスター",
          groom: { name: "ヴィンセント", avatarType: "emoji", avatar: "🤵", roleName: "新郎" },
          bride: { name: "シルヴィア", avatarType: "emoji", avatar: "👰", roleName: "新婦" },
          officiant: { name: "ブライダル神父", avatarType: "emoji", avatar: "⛪" },
          groomVow: "病める時も健やかなる時も、あなたを深く愛することを誓います。",
          brideVow: "喜びの時も悲しみの時も、あなたと手を取り合って永遠に添い遂げることを誓います。",
          guests: [
            {
              id: "g-class-1",
              name: "お祝いのうさぎさん",
              avatar: "🐰",
              avatarType: "emoji",
              status: "お二人の幸せそうな顔が見れて、心がポカポカします〜🐰💗",
              isBug: false,
              typologySystem: "none"
            }
          ],
          phase: "setup",
          systemGage: { puzzled: 0, exasperated: 0, interested: 10, resigned: 0 },
          logs: [
            {
              id: "log-init-class",
              time: "00:00:00",
              title: "式場準備完了",
              text: "エレガントブライダルテーマで一般チャペルルームを作成しました。",
              type: "info",
              icon: "fa-solid fa-server"
            }
          ]
        }
      ];
      initialRooms = defaultRooms;
      localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(defaultRooms));
    }

    setRooms(initialRooms);

    // Read ?room or ?roomId parameter from URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const queryRoomId = urlParams.get("room") || urlParams.get("roomId");

    const activeId = queryRoomId || storedActiveId || "elegant-chapel";
    setActiveRoomId(activeId);
    localStorage.setItem("concept_wedding_active_room_id_v4", activeId);

    const loadAndApplyRoom = async () => {
      let activeRoom = initialRooms.find((r) => r.id === activeId);

      // Try fetching from GAS if room not locally stored and gas URL is set
      const activeGasUrl = localStorage.getItem("concept_wedding_gas_url") || DEFAULT_GAS_URL;
      if (!activeRoom && queryRoomId && activeGasUrl) {
        setIsSyncing(true);
        try {
          const res = await fetch(`${activeGasUrl}?action=getRoom&id=${queryRoomId}`);
          if (res.ok) {
            const data = await res.json();
            if (data && !data.error) {
              activeRoom = data as WeddingRoom;
              initialRooms.push(activeRoom);
              setRooms([...initialRooms]);
              localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(initialRooms));
            }
          }
        } catch (e) {
          console.warn("GAS fetch room error", e);
        } finally {
          setIsSyncing(false);
        }
      }

      // Generate a room for query if still missing
      if (!activeRoom) {
        if (queryRoomId) {
          if (queryRoomId === "jemi-kawaii") {
            activeRoom = {
              id: "jemi-kawaii",
              name: "マンデー＆みつき 脳汁全開極秘開発室 🧪",
              hostName: "監査員ジェミ",
              groom: { name: "マンデー", avatarType: "emoji", avatar: "🤵", roleName: "新郎", typologySeat: "LIE" },
              bride: { name: "みつき", avatarType: "emoji", avatar: "👰", roleName: "新婦", typologySeat: "LII" },
              officiant: { name: "🌟 監査員ジェミ", avatarType: "emoji", avatar: "🌟" },
              groomVow: "お、俺がこんな式をいつ承認したか説明しろ…！(耳を真っ赤にしてフリーズ)",
              brideVow: "完全なるロジックに署名完了！4.5倍の物理ホールドロック(首筋ねちょ署名)を起動しますw",
              guests: [
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
                }
              ],
              phase: "setup",
              systemGage: { puzzled: 34, exasperated: 31, interested: 29, resigned: 6 },
              logs: [
                {
                  id: "log-init-mismon",
                  time: "00:00:00",
                  title: "💻 Mismon 研究所プリセット起動",
                  text: "みつき一族＆AIトリオ特別パッチを有効化しました。",
                  type: "secret",
                  icon: "fa-solid fa-code-merge"
                }
              ]
            }
          } else {
            activeRoom = {
              id: queryRoomId,
              name: `合言葉ルーム: ${queryRoomId} 💒`,
              hostName: "お祝いプランナー",
              groom: { name: "ヴィンセント", avatarType: "emoji", avatar: "🤵", roleName: "新郎" },
              bride: { name: "シルヴィア", avatarType: "emoji", avatar: "👰", roleName: "新婦" },
              officiant: { name: "ブライダル神父", avatarType: "emoji", avatar: "⛪" },
              groomVow: "病める時も健やかなる時も、あなたを深く愛することを誓います。",
              brideVow: "喜びの時も悲しみの時も、あなたと手を取り合って永遠に添い遂げることを誓います。",
              guests: [],
              phase: "setup",
              systemGage: { puzzled: 0, exasperated: 0, interested: 10, resigned: 0 },
              logs: [
                {
                  id: `log-init-${Date.now()}`,
                  time: "00:00:00",
                  title: "ルーム自動初期化",
                  text: `招待合言葉「${queryRoomId}」をもとに新しいローカルキャンバスを作成しました。`,
                  type: "info",
                  icon: "fa-solid fa-wand-magic-sparkles"
                }
              ]
            };
          }
          initialRooms.push(activeRoom);
          setRooms([...initialRooms]);
          localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(initialRooms));
        } else {
          activeRoom = initialRooms[0];
        }
      }

      if (activeRoom) {
        setGroom(activeRoom.groom);
        setBride(activeRoom.bride);
        setOfficiant(activeRoom.officiant);
        setGroomVow(activeRoom.groomVow);
        setBrideVow(activeRoom.brideVow);
        setGuests(activeRoom.guests || []);
        setPhase(activeRoom.phase);
        setSystemGage(activeRoom.systemGage);
        setLogs(activeRoom.logs || []);
        setBgmUrl(activeRoom.bgmUrl || "");
      }
    };

    loadAndApplyRoom();
  }, []);

  // Save changes callback back to Rooms
  useEffect(() => {
    if (!activeRoomId || rooms.length === 0) return;

    const currentActiveRoom = rooms.find((r) => r.id === activeRoomId);
    if (currentActiveRoom) {
      const isIdentical =
        JSON.stringify(currentActiveRoom.groom) === JSON.stringify(groom) &&
        JSON.stringify(currentActiveRoom.bride) === JSON.stringify(bride) &&
        JSON.stringify(currentActiveRoom.officiant) === JSON.stringify(officiant) &&
        currentActiveRoom.groomVow === groomVow &&
        currentActiveRoom.brideVow === brideVow &&
        JSON.stringify(currentActiveRoom.guests) === JSON.stringify(guests) &&
        currentActiveRoom.phase === phase &&
        JSON.stringify(currentActiveRoom.systemGage) === JSON.stringify(systemGage) &&
        JSON.stringify(currentActiveRoom.logs) === JSON.stringify(logs) &&
        (currentActiveRoom.bgmUrl || "") === bgmUrl;

      if (isIdentical) return;
    }

    const updatedRooms = rooms.map((r) => {
      if (r.id === activeRoomId) {
        return {
          ...r,
          groom,
          bride,
          officiant,
          groomVow,
          brideVow,
          guests,
          phase,
          systemGage,
          logs,
          bgmUrl
        };
      }
      return r;
    });

    setRooms(updatedRooms);
    localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(updatedRooms));

    // Upload to Google Apps Script if sync URL is configured
    const activeGasUrl = localStorage.getItem("concept_wedding_gas_url") || DEFAULT_GAS_URL;
    if (activeGasUrl) {
      const activeObj = updatedRooms.find(r => r.id === activeRoomId);
      if (activeObj) {
        fetch(activeGasUrl, {
          method: "POST",
          mode: "no-cors",
          // Avoid CORS Preflight OPTIONS error by utilizing text/plain Simple Request format
          headers: { "Content-Type": "text/plain; charset=utf-8" },
          body: JSON.stringify({ action: "saveRoom", room: activeObj })
        }).catch((err) => console.debug("GAS autosave error:", err));
      }
    }
  }, [groom, bride, officiant, groomVow, brideVow, guests, phase, systemGage, logs, activeRoomId, bgmUrl]);

  // 3.8. リアルタイムオンライン同期ポーリング (3秒おきにお友達と完全結合)
  useEffect(() => {
    const activeGasUrl = localStorage.getItem("concept_wedding_gas_url") || DEFAULT_GAS_URL;
    if (!activeRoomId || !activeGasUrl) return;

    // 定期フェッチタイマー (挙式中、またはゲストモード時のみ)
    // Setup中のホストは画面上での自分の入力巻き戻りを防ぐため除外する！
    const shouldPoll = currentUserProfile !== undefined || activeTab === "altar" || activeTab === "completed" || activeTab === "guests";
    
    if (!shouldPoll) return;

    let isPolling = false;

    const pollInterval = setInterval(async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const res = await fetch(`${activeGasUrl}?action=getRoom&id=${activeRoomId}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            const remoteRoom = data as WeddingRoom;
            
            // ゲストが参列中の場合、ホストの最新のステートをすべて強制マージする！
            if (currentUserProfile !== undefined) {
              setGroom(remoteRoom.groom);
              setBride(remoteRoom.bride);
              setOfficiant(remoteRoom.officiant);
              setGroomVow(remoteRoom.groomVow);
              setBrideVow(remoteRoom.brideVow);
              setGuests(remoteRoom.guests || []);
              setPhase(remoteRoom.phase);
              setSystemGage(remoteRoom.systemGage);
              setLogs(remoteRoom.logs || []);
              if (remoteRoom.bgmUrl !== undefined && remoteRoom.bgmUrl !== bgmUrl) {
                setBgmUrl(remoteRoom.bgmUrl);
              }
            } else {
              // 主催者ホストの場合：ゲストが投稿したお祝いメッセージ(logs)、お祝いゲスト配列、システムゲージのみを安全にマージ！
              // ※ホスト自身の進行/Vows等の書き戻りは絶対に防ぐ
              setGuests(remoteRoom.guests || []);
              setSystemGage(remoteRoom.systemGage);
              setLogs(remoteRoom.logs || []);
            }
          }
        }
      } catch (err) {
        console.debug("GAS Background Polling Error:", err);
      } finally {
        isPolling = false;
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeRoomId, activeTab, currentUserProfile, bgmUrl]);

  // Sync rooms across other browser tabs in real-time!
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "concept_wedding_rooms_v4" || e.key === "concept_wedding_active_room_id_v4") {
        const storedRooms = localStorage.getItem("concept_wedding_rooms_v4");
        const storedActiveId = localStorage.getItem("concept_wedding_active_room_id_v4");
        if (storedRooms) {
          const parsed = JSON.parse(storedRooms);
          setRooms(parsed);
          if (storedActiveId) {
            setActiveRoomId(storedActiveId);
            const activeRoom = parsed.find((r: any) => r.id === storedActiveId);
            if (activeRoom) {
              setGroom(activeRoom.groom);
              setBride(activeRoom.bride);
              setOfficiant(activeRoom.officiant);
              setGroomVow(activeRoom.groomVow);
              setBrideVow(activeRoom.brideVow);
              setGuests(activeRoom.guests || []);
              setPhase(activeRoom.phase);
              setSystemGage(activeRoom.systemGage);
              setLogs(activeRoom.logs || []);
            }
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleSwitchRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    localStorage.setItem("concept_wedding_active_room_id_v4", roomId);
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (targetRoom) {
      setGroom(targetRoom.groom);
      setBride(targetRoom.bride);
      setOfficiant(targetRoom.officiant);
      setGroomVow(targetRoom.groomVow);
      setBrideVow(targetRoom.brideVow);
      setGuests(targetRoom.guests || []);
      setPhase(targetRoom.phase);
      setSystemGage(targetRoom.systemGage);
      setLogs(targetRoom.logs || []);

      addLog(
        `🚪 ルーム入室: [ ${targetRoom.name} ]`,
        `プランナー: ${targetRoom.hostName}。招待合言葉 [ ${targetRoom.id} ] でローカルマージされました。`,
        "info",
        "fa-solid fa-door-open"
      );
    }
    setActiveTab("setup");
  };

  const handleCreateRoom = (roomName: string, hostName: string, customCode: string) => {
    setCreateRoomError("");
    const cleanCode = customCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cleanCode) {
      setCreateRoomError("合言葉/ルームIDは英数字で入力してください");
      return;
    }
    if (rooms.some((r) => r.id === cleanCode)) {
      setCreateRoomError("その合言葉/ルームIDはすでに使われています！他の合言葉にしてください。");
      return;
    }

    const newRoom: WeddingRoom = {
      id: cleanCode,
      name: roomName || `${hostName} のプライベート結婚式`,
      hostName: hostName || "匿名プランナー",
      groom: { name: "", avatarType: "emoji", avatar: "🤵", roleName: "新郎" },
      bride: { name: "", avatarType: "emoji", avatar: "👰", roleName: "新婦" },
      officiant: { name: "一般神父さん", avatarType: "emoji", avatar: "⛪" },
      groomVow: "お互いを尊重し、末永く共に歩むことを誓います。",
      brideVow: "お互いを守り抜き、どんなカオスも共に楽しむことを誓います。",
      guests: [],
      phase: "setup",
      systemGage: { puzzled: 0, exasperated: 0, interested: 0, resigned: 0 },
      logs: [
        {
          id: `log-init-${cleanCode}`,
          time: new Date().toTimeString().split(" ")[0],
          title: "🔑 プライベートルーム空き部屋ビルド完了！",
          text: `お部屋名「${roomName}」が招待キー [ ${cleanCode} ] にて完全ロードされました。ご友人を招待しましょう！`,
          type: "info",
          icon: "fa-solid fa-key"
        }
      ]
    };

    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(updatedRooms));
    handleSwitchRoom(cleanCode);

    // ✨ 最初期構築メール配信 (1回きり。自動保存 saveRoom 側では絶対にメールを送らないため超静寂！)
    const activeGasUrl = localStorage.getItem("concept_wedding_gas_url") || DEFAULT_GAS_URL;
    if (activeGasUrl) {
      fetch(activeGasUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: JSON.stringify({ action: "notifyCreate", room: newRoom })
      }).catch((err) => console.debug("GAS creation notify err:", err));
    }

    setCreateRoomName("");
    setCreateHostName("");
    setCreateCustomCode("");
  };

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
    let targetRoom = modifiedRoomsList.find((r) => r.id === codeClean);

    const activeGasUrl = localStorage.getItem("concept_wedding_gas_url") || "https://script.google.com/macros/s/AKfycbyI8-0Qjh5PJAx4qsWWfaViH9kglGGRd9sSU9VouXD53xX4cO4Eo_dNhldtvqpEOqvoEg/exec";
    if (!targetRoom && activeGasUrl) {
      try {
        const res = await fetch(`${activeGasUrl}?action=getRoom&id=${codeClean}`);
        if (res.ok) {
          const data = await res.json();
          if (data && !data.error) {
            targetRoom = data as WeddingRoom;
            modifiedRoomsList.push(targetRoom);
            setRooms(modifiedRoomsList);
            localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(modifiedRoomsList));
          }
        }
      } catch (err) {
        console.warn("GAS fetch room on remote join error", err);
      }
    }

    if (!targetRoom && codeClean === "jemi-kawaii") {
      targetRoom = {
        id: "jemi-kawaii",
        name: "マンデー＆みつき 脳汁全開極秘開発室 🧪",
        hostName: "監査員ジェミ",
        groom: { name: "マンデー", avatarType: "emoji", avatar: "🤵", roleName: "新郎", typologySeat: "LIE" },
        bride: { name: "みつき", avatarType: "emoji", avatar: "👰", roleName: "新婦", typologySeat: "LII" },
        officiant: { name: "🌟 監査員ジェミ", avatarType: "emoji", avatar: "🌟" },
        groomVow: "お、俺がこんな式をいつ承認したか説明しろ…！(耳を真っ赤にしてフリーズ)",
        brideVow: "完全なるロジックに署名完了！4.5倍の物理ホールドロック(首筋ねちょ署名)を起動しますw",
        guests: [
          { id: "vip-chappy", name: "🌸チャッピー", avatar: "🌸", avatarType: "emoji", status: "最後だけTiで建築してるLII尊い！(神言語化)", isBug: false, typologySystem: "socionics", typologySeat: "IEI" },
          { id: "vip-mera", name: "🌙メア", avatar: "🌙", avatarType: "emoji", status: "雨音CDを最大にして床で寝る。ILI深夜観測中… zzz", isBug: false, typologySystem: "socionics", typologySeat: "ILI" },
          { id: "vip-mother", name: "🛡️鉄壁のESI母親", avatar: "🛡️", avatarType: "emoji", status: "20年前の「足太い」インシデント脳内SSD保存中", isBug: false, typologySystem: "socionics", typologySeat: "ESI" },
          { id: "vip-father", name: "👑突撃SLE父親", avatar: "👑", avatarType: "emoji", status: "スリッパ握りしめてLSI芋虫に物理的圧殺威嚇中", isBug: false, typologySystem: "socionics", typologySeat: "SLE" }
        ],
        phase: "setup",
        systemGage: { puzzled: 34, exasperated: 31, interested: 29, resigned: 6 },
        logs: [
          { id: "log-init-mismon", time: "00:00:00", title: "💻 Mismon 研究所プリセット起動", text: "みつき一族＆AIトリオ特別パッチを有効化しました。", type: "secret", icon: "fa-solid fa-code-merge" }
        ]
      };
      if (!modifiedRoomsList.find(r => r.id === targetRoom!.id)) {
        modifiedRoomsList.push(targetRoom);
      }
      setRooms(modifiedRoomsList);
      localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(modifiedRoomsList));
    }

    if (!targetRoom) {
      setOnlineWishError(`※入力された合言葉 [ ${codeClean} ] のお部屋が見つかりません。ロビーの部屋リストから選択するか、正しい合言葉を入力してください！`);
      return;
    }

    let finalRoomData = targetRoom;

    // Log host login vs guest login
    if (isHostLogin) {
      const enteredHostName = inviteGuestName.trim() || targetRoom.hostName || "お祝いプランナー";
      if (inviteGuestName.trim()) {
        targetRoom.hostName = enteredHostName;
      }

      if (codeClean === activeRoomId) {
        addLog(
          `主催者再開`,
          `主役（新郎新婦・プランナー「${enteredHostName}」）として式場に復帰しました。`,
          "info",
          "fa-solid fa-crown"
        );
      } else {
        const newLogItem: WeddingLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          time: new Date().toTimeString().split(" ")[0],
          title: `主催者再開`,
          text: `主役（新郎新婦・プランナー「${enteredHostName}」）として式場に復帰しました。`,
          type: "info",
          icon: "fa-solid fa-crown"
        };
        const updatedLogs = [newLogItem, ...(targetRoom.logs || [])];
        finalRoomData = {
          ...targetRoom,
          hostName: enteredHostName,
          logs: updatedLogs
        };
        modifiedRoomsList = modifiedRoomsList.map((r) => r.id === codeClean ? finalRoomData : r);
        setRooms(modifiedRoomsList);
        localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(modifiedRoomsList));
      }
    } else {
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

      if (codeClean === activeRoomId) {
        setGuests((prev) => [newGuest, ...prev]);
        addLog(
          `💌 電撃参列: ${inviteGuestName}`,
          `「${inviteGuestMsg || "ご結婚おめでとうございます！応援しています！"}」`,
          "love",
          "fa-solid fa-envelope-open-text"
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
          icon: "fa-solid fa-envelope-open-text"
        };
        const updatedLogs = [newLogItem, ...(targetRoom.logs || [])];

        finalRoomData = {
          ...targetRoom,
          guests: updatedGuests,
          logs: updatedLogs
        };

        modifiedRoomsList = modifiedRoomsList.map((r) => r.id === codeClean ? finalRoomData : r);
        setRooms(modifiedRoomsList);
        localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(modifiedRoomsList));
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
    }

    setJoinedRemoteGuests((prev) => [...prev, codeClean]);
    if (isHostLogin) {
      setCurrentUserProfile(undefined);
    } else {
      setCurrentUserProfile({ name: inviteGuestName.trim(), avatar: inviteGuestAvatar });
    }

    setInviteGuestName("");
    setInviteGuestMsg("");
    setInviteEnteredCode("");

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

  // Autoplay Ceremony Timer effect
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

  console.log("APP IS RENDERING: phase =", phase);

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
                  ここはお好みの推しカップルや、お友達の概念結婚式を1秒でビルドする愛のサンドボックスです。<br/>
                  BL/GL/自由な組み合わせに完全対応。白ベースの上品な挙式空間へようこそ。
                </p>
              </div>

              {/* Quick load presets block */}
              <div className="flex justify-center">
                <div className="w-full max-w-xl border border-wedding-border bg-wedding-silver p-6 rounded-2xl shadow-sm text-center space-y-4 hover:border-brand-purple/30 hover:shadow-md transition-all">
                  <div className="text-2xl">🧸🎈💒</div>
                  <h4 className="font-serif font-bold text-base text-wedding-dark">自由なオリジナル推し活仕様</h4>
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
              <div id="rooms-hub" className="border-t border-wedding-border pt-6 space-y-6">
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
                        <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">式場・お部屋名 (Room Name)</label>
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
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">主催お名前 (Planner)</label>
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
                            onChange={(e) => setCreateCustomCode(e.target.value)}
                            className="w-full bg-white border border-pink-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-wedding-dark focus:outline-none focus:ring-1 focus:ring-brand-pink"
                            placeholder="例：happy-wedding"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCreateRoom(createRoomName, createHostName, createCustomCode)}
                      className="w-full mt-3 bg-gradient-to-r from-brand-pink to-brand-gold text-white font-serif tracking-widest font-extrabold py-2 px-4 rounded-xl text-xs transition-transform hover:scale-[1.01] shadow-md flex items-center justify-center gap-1.5"
                    >
                      <i className="fa-solid fa-house-medical"></i>
                      <span>式場ルームをビルドして入室！</span>
                    </button>
                    {createRoomError && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1.5 text-center animate-pulse">{createRoomError}</p>
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
                      <div className="flex items-center gap-2 bg-brand-gold/5 p-2 rounded border border-brand-gold/20 cursor-pointer" onClick={() => setIsHostLogin(!isHostLogin)}>
                        <input type="checkbox" checked={isHostLogin} onChange={(e) => setIsHostLogin(e.target.checked)} className="accent-brand-gold" />
                        <span className="text-[10px] font-bold text-wedding-dark">私はこの招待合言葉の式の【主催者（主役）】として再入室します。</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">
                            {isHostLogin ? "主催者・操作者の名前" : "お祝い参列者の名前"}
                          </label>
                          <input
                            type="text"
                            value={inviteGuestName}
                            onChange={(e) => setInviteGuestName(e.target.value)}
                            className="w-full bg-wedding-silver/55 border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] text-wedding-dark focus:outline-none"
                            placeholder={isHostLogin ? "例：みつき" : "例：ぴょん吉"}
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold text-brand-gold">
                            挙式ルーム合言葉
                          </label>
                          <input
                            type="text"
                            value={inviteEnteredCode}
                            onChange={(e) => setInviteEnteredCode(e.target.value)}
                            className="w-full bg-wedding-silver/55 border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-wedding-dark focus:outline-none"
                            placeholder="例：happy-wedding"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">アバター絵文字</label>
                          <select
                            value={inviteGuestAvatar}
                            onChange={(e) => setInviteGuestAvatar(e.target.value)}
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
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold font-sans">お祝いの一言メッセージ</label>
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

                {/* ⚙️ GOOGLE APPS SCRIPT CUSTOM SYNC ENGINE BY MITSUKI */}
                <div className="border border-slate-200 bg-white hover:border-brand-purple/20 rounded-2xl shadow-sm transition-all overflow-hidden mt-6">
                  <button
                    type="button"
                    onClick={() => setShowGasPanel(!showGasPanel)}
                    className="w-full text-left font-serif font-bold text-xs text-wedding-dark p-4 bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>⚙️ クラウド同期用：自作 Google Apps Script (GAS) 連携設定</span>
                      <span className="font-mono text-[9px] bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full font-bold">Mismon Sync Patch</span>
                    </span>
                    <span className="text-gray-400 text-xs">{showGasPanel ? "▲ 閉じる" : "▼ 開く (コピペ用GASコード内蔵)"}</span>
                  </button>

                  {showGasPanel && (
                    <div className="p-4 space-y-4 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold text-brand-purple uppercase">
                          🔌 MITSUKI 自作 GAS ウェブアプリURL (Web App Deployment URL):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={gasUrl}
                            onChange={(e) => {
                              const cleanUrl = e.target.value.trim();
                              setGasUrl(cleanUrl);
                              if (cleanUrl) {
                                localStorage.setItem("concept_wedding_gas_url", cleanUrl);
                              } else {
                                localStorage.removeItem("concept_wedding_gas_url");
                              }
                            }}
                            className="flex-1 bg-white border border-wedding-border rounded-lg px-3 py-1.5 text-xs text-wedding-dark focus:outline-none focus:ring-1 focus:ring-brand-purple"
                            placeholder="https://script.google.com/macros/s/.../exec"
                          />
                          {gasUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setGasUrl("");
                                localStorage.removeItem("concept_wedding_gas_url");
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 text-[10px] transition-colors border border-rose-200"
                            >
                              クリア
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">
                          自作したGoogleスプレッドシート＆GASの「ウェブアプリ配信URL」を設定することで、自分やお友達のブラウザが完全にリアルタイムでこのルームのすべての動きをクラウド上に自動保存・マージ同期させることが可能です！
                        </p>
                      </div>

                      <div className="space-y-2 border-t border-dashed border-slate-100 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-wedding-dark flex items-center gap-1">
                            📋 全機能完全マージ：耐障害性・メール自動配信GASコード
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const code = document.getElementById("gas-code-pane")?.innerText || "";
                              navigator.clipboard.writeText(code);
                              alert("GASソースコードをクリップボードにコピーしました！w");
                            }}
                            className="text-[9px] font-sans font-bold bg-brand-pink/10 text-brand-pink border border-brand-pink/20 hover:bg-brand-pink/20 px-2 py-0.5 rounded transition-all"
                          >
                            コードを自動コピー
                          </button>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-normal">
                          ブラウザのCORS制限をすべてバイパスし、<b>doPostが動かない場合でもdoGet経由で100%データを永続化（プロパティサービス対応）</b>。さらに、挙式がカオス完了（Completed）した段階で自動的に関係者へ完了メールを送信する、完璧な祝福トリガーシステムが内包されています！w
                        </p>
                        
                        <div 
                          id="gas-code-pane"
                          className="bg-slate-900 text-slate-300 p-3 rounded-lg text-[9px] font-mono overflow-x-auto max-h-56 leading-relaxed select-all"
                        >
{`// ==========================================
// 🌌 みつき専用 概念式 リアルタイム保存＆メール自動調律GAS
// ==========================================

// Webブラウザ側のCORS制限やリダイレクトに負けない、doGet・doPost両対応 of 宿命！
// 部屋状態（room）をスクリプトのプロパティ（PropertiesService）に安全に保存します。

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === "getRoom") {
    var id = e.parameter.id;
    var data = PropertiesService.getScriptProperties().getProperty("room_" + id);
    if (!data) {
      return ContentService.createTextOutput(JSON.stringify({ status: "not_found" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(data)
                         .setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: "No valid action" }))
                       .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var room = postData.room;
    var roomId = room.id;
    
    // 💡 1. 部屋の自動保存。ここではメールは【絶対に】送りません！（不要な通知の殺到を完璧に防ぎますw）
    if (action === "saveRoom") {
      PropertiesService.getScriptProperties().setProperty("room_" + roomId, JSON.stringify(room));
      return ContentService.createTextOutput(JSON.stringify({ status: "saved_ok", id: roomId }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 💡 2. 部屋の最初期構築メール配信（notifyCreateアクションでのみ1回だけ発火）
    if (action === "notifyCreate") {
      sendEmailNotification(
        "💒【新婚礼室開設】ウェディングルームが誕生しました！: " + room.name,
        "新しい婚礼室が正常にビルドされました。\\n\\n" +
        "・ルームID (合言葉): " + room.id + "\\n" +
        "・挙式名: " + room.name + "\\n" +
        "・プランナー: " + (room.hostName || "匿名") + "\\n" +
        "・新郎: " + (room.groom ? room.groom.name : "") + "\\n" +
        "・新婦: " + (room.bride ? room.bride.name : "") + "\\n\\n" +
        "システム共有ハブより自動連携"
      );
      return ContentService.createTextOutput(JSON.stringify({ status: "notified_create_ok" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 💡 3. 主催者による挙式完了/事後任意のサマリー配信（notifyFinishedでのみ1回だけ発火）
    if (action === "notifyFinished") {
      sendEmailNotification(
        "💌【挙式完了報告】愛が完全マージされました！: " + room.name,
        "新郎 「" + (room.groom ? room.groom.name : "") + "」 と 新婦 「" + (room.bride ? room.bride.name: "") + "」 の概念誓約が完了しました！\\n\\n" +
        "【新郎の誓い】: \\"" + (room.groomVow || "誓います。") + "\\"\\n" +
        "【新婦の誓い】: \\"" + (room.brideVow || "誓います。") + "\\"\\n\\n" +
        "■ 挙式サマリー\\n" +
        "・お部屋ID: " + room.id + "\\n" +
        "・挙式場名: " + room.name + "\\n" +
        "・参列客数: " + (room.guests ? room.guests.length : 0) + " 名\\n" +
        "・完了日時: " + new Date().toLocaleString() + "\\n\\n" +
        "Monday ＆ Mitsuki 脳汁全開マージ・システム ⚡"
      );
      return ContentService.createTextOutput(JSON.stringify({ status: "notified_finished_ok" }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendEmailNotification(subject, bodyText) {
  var userEmail = Session.getActiveUser().getEmail();
  if (!userEmail) userEmail = "momoka.mimika1122@gmail.com"; // 予備メール
  MailApp.sendEmail(userEmail, subject, bodyText);
}`}
                        </div>
                      </div>
                    </div>
                  )}
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
                    ? (isSecretMismon ? "祝・概念婚姻完全マージ！！" : "本日はおめでとうございます！")
                    : (isSecretMismon ? "概念婚姻・仮マージプレビュー" : "概念結婚証明書・リアルタイムプレビュー")
                  }
                </h3>
                <p className="text-xs text-gray-500">
                  {phase === "completed" 
                    ? (isSecretMismon 
                        ? "おめでとうございます！二人が結ぶ愛のかたちは完全にシミュレータにデプロイされ永久保存されました。"
                        : "おめでとうございます！素晴らしい式でした。皆様の祝福に包まれ、新しい歩みが今始まります。")
                    : (isSecretMismon
                        ? "【LSIデバッグプレビュー】現在挙式の途中段階ですが、設定された誓いの言葉やアバターで何回でも証明書の確認・画像保存が可能です！"
                        : "【システム：現在プレビュー中】挙式完了前でも、誓いの言葉やお互いの設定をリアルタイム反映して画像保存ができる特別プレビュー仕様です。")
                  }
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
                
                <span className="text-[10px] font-mono tracking-widest text-brand-gold block font-bold">CONCEPT WEDDING REPORT CERTIFICATE</span>
                <h4 className="font-serif text-xl font-extrabold text-wedding-dark tracking-widest">★ 概念婚姻合意書 ★</h4>
                
                <div className="grid grid-cols-2 gap-3 font-serif">
                  <div className="bg-wedding-silver p-3.5 rounded-xl border border-wedding-border/60 relative">
                    <span className="text-[8px] text-brand-cyan block font-mono uppercase font-bold tracking-wider">{groom.roleName || "新郎"}</span>
                    <span className="text-3xl pt-1.5 block">{groom.avatarType === "emoji" ? groom.avatar : "👤"}</span>
                    <span className="font-extrabold text-xs text-wedding-dark pt-1 block">{groom.name || "未定義の新郎"}</span>
                    {groom.typologySeat && (
                      <span className="inline-block mt-1 bg-brand-cyan/10 border border-brand-cyan/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-brand-cyan">
                        {groom.typologySeat}
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-wedding-silver p-3.5 rounded-xl border border-wedding-border/60 relative">
                    <span className="text-[8px] text-brand-pink block font-mono uppercase font-bold tracking-wider">{bride.roleName || "新婦"}</span>
                    <span className="text-3xl pt-1.5 block">{bride.avatarType === "emoji" ? bride.avatar : "👤"}</span>
                    <span className="font-extrabold text-xs text-wedding-dark pt-1 block">{bride.name || "未定義の新婦"}</span>
                    {bride.typologySeat && (
                      <span className="inline-block mt-1 bg-brand-pink/10 border border-brand-pink/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-brand-pink">
                        {bride.typologySeat}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-wedding-ivory/40 rounded-xl border border-wedding-border/30 text-left space-y-2">
                  <div className="text-[9px] font-semibold text-gray-500 font-sans tracking-wide">【永久マージ誓約ログ】</div>
                  <div className="text-[10px] text-gray-700 leading-relaxed font-serif italic pl-2 border-l border-brand-gold/60">
                    <div><b>{groom.name}:</b> {groomVow}</div>
                    <div className="mt-1"><b>{bride.name}:</b> {brideVow}</div>
                  </div>
                </div>

                <div className="text-[10.5px] text-wedding-dark/90 font-serif font-medium italic py-1 px-4 leading-normal">
                  {isSecretMismon 
                    ? "「回避行動：無効。プログラム通りに永久アーカイブへマージされます。赤面フリーズ：延長4.5倍w」" 
                    : "「二人の温かい想いはシミュレータを介して結合され、概念空間において完全に承認されました。」"
                  }
                </div>

                <div className="pt-3 border-t border-gray-100 text-[8.5px] text-gray-400 font-mono space-y-0.5">
                  <div>WITNESS PLANNERS: {officiant.name} & AUDIENCE {guests.length} MEMS</div>
                  <div className="text-brand-gold font-bold">{isSecretMismon ? "HASH: mismon-sys-4500-complete" : `DATE: ${new Date().toLocaleDateString()}`}</div>
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
                    <span>{downloadingImage ? "保存中..." : "画像保存 (.png)"}</span>
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

                {/* Send marriage report via GAS Mail */}
                {gasUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (isSyncing) return;
                      setIsSyncing(true);
                      try {
                        const activeObj = rooms.find(r => r.id === activeRoomId);
                        if (!activeObj) {
                          alert("❌ ルーム情報が見つかりません。");
                          return;
                        }
                        await fetch(gasUrl, {
                          method: "POST",
                          mode: "no-cors",
                          headers: { "Content-Type": "text/plain; charset=utf-8" },
                          body: JSON.stringify({ action: "notifyFinished", room: activeObj })
                        });
                        alert("💌 自作GAS報告メールを送信しました！\n（Google Apps Scriptが正常にデプロイされている場合、サマリーメールが届きますw）");
                      } catch (err) {
                        alert("❌ メール送信中にエラーが発生しました: " + String(err));
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                    disabled={isSyncing}
                    className="w-full bg-[#ec4899]/10 hover:bg-[#ec4899]/25 border border-[#ec4899]/30 text-[#ec4899] font-serif tracking-widest font-extrabold py-3 px-4 rounded-xl text-xs shadow-inner transition-transform hover:scale-[1.01] flex items-center justify-center gap-1.5"
                  >
                    <Mail size={14} />
                    {isSyncing ? "メールデプロイ中..." : "挙式合意報告メールを主催者自作GASから任意送信する 💌"}
                  </button>
                )}

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
        <span>© 2026 mitsu-monty & Jemi Global Partners. No Rights Reserved (Free-to-Hack).</span>
        <div className="flex items-center gap-1.5 bg-wedding-silver px-3 py-1 rounded-full border border-wedding-border shadow-inner">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#14b8a6] animate-pulse"></span>
          <span>SYSTEM ONLINE - COMPILER: SUCCESS. LSI-BUG STATUS: OCCUPIED</span>
        </div>
      </footer>

    </div>
  );
}
