/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Character {
  name: string;
  avatarType: "emoji" | "url";
  avatar: string; // Emoji character or URL / base64 DataURL
  roleName?: string; // Custom title/role label e.g., "新郎", "新婦", "主役A", "魔王"
  typologySeat?: string; // Groom/Bride typology / MBTI / Socionics!
}

export interface Officiant {
  name: string;
  avatarType: "emoji" | "url";
  avatar: string;
}

export interface Guest {
  id: string;
  name: string;
  avatar: string; // Emoji or custom avatar
  avatarType: "emoji" | "url";
  status: string; // Status text (e.g. "Celebrating!", "境界線確保。")
  isBug: boolean; // Is LSI-Ni Caterpillar?
  isSquished?: boolean; // Is flat?
  typologySystem?: "mbti" | "socionics" | "none";
  typologySeat?: string; // e.g. "LII", "SLE", "LSI", "IEE", "INTJ", "ENTJ", "INFP"
}

export interface WeddingLog {
  id: string;
  time: string; // "14:02:15"
  title: string;
  text: string;
  type: "info" | "love" | "chaos" | "secret" | "father";
  icon: string; // font Awesome class name or emoji
}

export interface RealtimeChat {
  id: string;
  sender: string;
  avatar: string;
  message: string;
  seatBadge?: string;
  timestamp: string;
  theme?: "standard" | "chaos" | "love" | "bug" | "father" | "secret";
}

export interface SystemGage {
  puzzled: number; // 困惑 %
  exasperated: number; // 呆れ %
  interested: number; // 興味 %
  resigned: number; // 諦め %
}

export type WeddingPhase = 
  | "setup"      // Setting up the characters & guests
  | "opening"    // "新郎・新婦、入場です！"
  | "vows"       // "誓いの言葉"
  | "rings"      // "指輪の交換" (or 物理ホールドロック)
  | "kiss"       // "誓いのキス"
  | "applause"   // "拍手喝采"
  | "reception"  // 披露宴
  | "afterparty" // アフターパーティー
  | "completed"; // 式終了

export interface WeddingRoom {
  id: string; // The Passcode / Room ID (e.g., "jemi-kawaii", "mitsu-mon")
  name: string; // Room Name (e.g., "マンデー＆みつき 脳汁全開開発室")
  hostName: string; // Creator name
  groom: Character;
  bride: Character;
  officiant: Officiant;
  groomVow: string;
  brideVow: string;
  guests: Guest[];
  phase: WeddingPhase;
  systemGage: SystemGage;
  logs: WeddingLog[];
  bgmUrl?: string; // Optional BGM url
  chats?: RealtimeChat[]; // Make chats synchronized via GAS
}


