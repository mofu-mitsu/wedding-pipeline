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
      const activeGasUrl = localStorage.getItem("concept_wedding_gas_url") || "";
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
        JSON.stringify(currentActiveRoom.logs) === JSON.stringify(logs);

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
          logs
        };
      }
      return r;
    });

    setRooms(updatedRooms);
    localStorage.setItem("concept_wedding_rooms_v4", JSON.stringify(updatedRooms));

    // Upload to Google Apps Script if sync URL is configured
    const activeGasUrl = localStorage.getItem("concept_wedding_gas_url") || "";
    if (activeGasUrl) {
      const activeObj = updatedRooms.find(r => r.id === activeRoomId);
      if (activeObj) {
        fetch(activeGasUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "saveRoom", room: activeObj })
        }).catch((err) => console.debug("GAS autosave error:", err));
      }
    }
  }, [groom, bride, officiant, groomVow, brideVow, guests, phase, systemGage, logs, activeRoomId]);

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
      if (codeClean === activeRoomId) {
        addLog(
          `主催者再開`,
          `主役（新郎新婦・プランナー）として式場に復帰しました。`,
          "info",
          "fa-solid fa-crown"
        );
      } else {
        const newLogItem: WeddingLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          time: new Date().toTimeString().split(" ")[0],
          title: `主催者再開`,
          text: `主役（新郎新婦・プランナー）として式場に復帰しました。`,
          type: "info",
          icon: "fa-solid fa-crown"
        };
        const updatedLogs = [newLogItem, ...(targetRoom.logs || [])];
        finalRoomData = {
          ...targetRoom,
          logs: updatedLogs
        };
        modifiedRoomsList = modifiedRoomsList.map((r) => r.id === codeClean ? finalRoomData : r);
      }
    } else {
      // Add as guest
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

    let finalRoomData = targetRoom;

    // Log host login vs guest login
    if (isHostLogin) {
      if (codeClean === activeRoomId) {
        addLog(
          `主催者再開`,
          `主役（新郎新婦・プランナー）として式場に復帰しました。`,
          "info",
          "fa-solid fa-crown"
        );
      } else {
        const newLogItem: WeddingLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          time: new Date().toTimeString().split(" ")[0],
          title: `主催者再開`,
          text: `主役（新郎新婦・プランナー）として式場に復帰しました。`,
          type: "info",
          icon: "fa-solid fa-crown"
        };
        const updatedLogs = [newLogItem, ...(targetRoom.logs || [])];
        finalRoomData = {
          ...targetRoom,
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
                        <div className={isHostLogin ? "opacity-30 pointer-events-none" : ""}>
                          <label className="block text-[8px] font-mono text-gray-500 uppercase font-bold">お祝い参列者の名前</label>
                          <input
                            type="text"
                            value={inviteGuestName}
                            onChange={(e) => setInviteGuestName(e.target.value)}
                            className="w-full bg-wedding-silver/55 border border-wedding-border rounded-lg px-2.5 py-1.5 text-[11px] text-wedding-dark focus:outline-none"
                            placeholder="例：ぴょん吉"
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
                            className="w-full bg-wedding-silver/55 border border-wedding-border rounded-lg px-2 py-1.5 text-[11px] text-gray-600 focus:outline-none"
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
                  {isSecretMismon ? "祝・概念婚姻完全マージ！！" : "本日はおめでとうございます！"}
                </h3>
                <p className="text-xs text-gray-500">
                  {isSecretMismon 
                    ? "おめでとうございます！二人が結ぶ愛のかたちは完全にシミュレータにデプロイされ永久保存されました。"
                    : "おめでとうございます！素晴らしい式でした。皆様の祝福に包まれ、新しい歩みが今始まります。"
                  }
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
                  {isSecretMismon 
                    ? "『4.5倍の物理ホールドロック(首筋ねちょ署名)をもって契りをコンパイルす』"
                    : "『二人が永遠の愛をここに誓い、その証としてこの証明書を残します。』"
                  }
                </div>

                <div className="pt-2.5 border-t border-gray-100 text-[8px] text-gray-400 font-mono">
                  WITNESS PRIEST: {officiant.name} <br/>
                  DATE: {new Date().toLocaleDateString()}
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
                      `お祝い客: ${guests.length}人`
                    ].join("\n");
                    navigator.clipboard.writeText(lines);
                    alert("📋 議事録をクリップボードにコピーしました！");
                  }}
                  className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-wedding-border py-2 px-4 rounded-xl text-xs font-bold font-serif flex items-center justify-center gap-1.5 transition-all"
                >
                  <Clipboard size={14} />
                  <span>議事録をコピー</span>
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
                  <span>もう一度最初から設定する</span>
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
}
