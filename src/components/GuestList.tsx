/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Guest } from "../types";
import { Plus, Trash2, RefreshCw, Layers, Smile } from "lucide-react";
import { SOCIONICS_SEATS, MBTI_SEATS, TYPOLOGY_TEMPLATES, TypologyTemplate } from "../utils/typologyData";

interface GuestListProps {
  guests: Guest[];
  onAddGuest: (
    name: string,
    avatar: string,
    isBug: boolean,
    status: string,
    typologySystem?: "mbti" | "socionics" | "none",
    typologySeat?: string
  ) => void;
  onRemoveGuest: (id: string) => void;
  onClearGuests: () => void;
}

export const GuestList: React.FC<GuestListProps> = ({
  guests,
  onAddGuest,
  onRemoveGuest,
  onClearGuests,
}) => {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("😎");
  const [status, setStatus] = useState("お祝い中！🎉");

  // Typology state
  const [typoSystem, setTypoSystem] = useState<"mbti" | "socionics" | "none">("socionics");
  const [selectedSeat, setSelectedSeat] = useState("LII");

  const handleSeatChange = (seat: string) => {
    setSelectedSeat(seat);
    // Find representative templates for this seat and auto fill
    const temps = TYPOLOGY_TEMPLATES[seat];
    if (temps && temps.length > 0) {
      // Pick random one
      const r = temps[Math.floor(Math.random() * temps.length)];
      setName(r.name);
      setAvatar(r.avatar);
      setStatus(r.status);
    }
  };

  const handleSystemChange = (sys: "mbti" | "socionics" | "none") => {
    setTypoSystem(sys);
    if (sys === "socionics") {
      handleSeatChange("LII");
    } else if (sys === "mbti") {
      handleSeatChange("INTJ");
    } else {
      setName("推しのゲスト");
      setAvatar("🥰");
      setStatus("心の底から2人を祝福しています！🎉");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const isBug = name.includes("芋虫") || avatar === "🐛" || selectedSeat === "LSI";
    onAddGuest(
      name,
      avatar,
      isBug,
      status,
      typoSystem,
      typoSystem !== "none" ? selectedSeat : undefined
    );

    // Reset with another random template of same type to encourage dynamic deployment!
    if (typoSystem !== "none") {
      const temps = TYPOLOGY_TEMPLATES[selectedSeat];
      if (temps && temps.length > 0) {
        const r = temps[Math.floor(Math.random() * temps.length)];
        setName(r.name + " " + Math.floor(Math.random() * 10)); // uniqueness
        setStatus(r.status);
      }
    } else {
      setName("");
      setStatus("お祝い中！🎉");
    }
  };

  const presetGuestAvatars = ["😎", "🥰", "🥳", "🌸", "🌙", "🐛", "👑", "🛡️", "👽", "🦄", "🐶", "🧸"];

  return (
    <div id="guests-manager" className="bg-wedding-ivory border border-wedding-border rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
      {/* Decorative vertical rose gold line */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-purple to-brand-pink"></div>

      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-users text-brand-purple text-xl"></i>
          <div>
            <h2 className="font-serif text-lg tracking-wider text-wedding-dark font-bold uppercase">2. 観客マネージャー</h2>
            <p className="text-[10px] text-gray-400">式場にデプロイする観客を配置・管理します</p>
          </div>
        </div>
        <span className="font-mono text-xs bg-wedding-silver border border-wedding-border px-3 py-1 rounded-full text-brand-purple font-extrabold shadow-sm">
          {guests.length} 人
        </span>
      </div>

      {/* Guest Add Form */}
      <form onSubmit={handleSubmit} className="bg-wedding-silver border border-wedding-border rounded-xl p-4.5 space-y-4">
        
        {/* Step-by-step seat type setup */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-brand-purple tracking-widest font-extrabold uppercase block">
            観客席＆性格タイプの設定 (デフォルトセリフ自動充填)
          </span>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleSystemChange("socionics")}
              className={`py-1 text-[10px] font-mono rounded border transition-all ${
                typoSystem === "socionics"
                  ? "bg-brand-purple/15 border-brand-purple text-brand-purple font-bold shadow-sm"
                  : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
              }`}
            >
              ソシオニクス席
            </button>
            <button
              type="button"
              onClick={() => handleSystemChange("mbti")}
              className={`py-1 text-[10px] font-mono rounded border transition-all ${
                typoSystem === "mbti"
                  ? "bg-brand-purple/15 border-brand-purple text-brand-purple font-bold shadow-sm"
                  : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
              }`}
            >
              MBTI席
            </button>
            <button
              type="button"
              onClick={() => handleSystemChange("none")}
              className={`py-1 text-[10px] font-mono rounded border transition-all ${
                typoSystem === "none"
                  ? "bg-brand-purple/15 border-brand-purple text-brand-purple font-bold shadow-sm"
                  : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
              }`}
            >
              一般来賓席
            </button>
          </div>

          {/* Seat details */}
          {typoSystem !== "none" && (
            <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-wedding-border">
              <label className="block text-[10px] text-gray-500 font-mono font-semibold">
                {typoSystem === "socionics" ? "ソシオニクス座席タイプ" : "MBTI座席タイプ"}
              </label>
              <div className="flex flex-wrap gap-1">
                {(typoSystem === "socionics" ? SOCIONICS_SEATS : MBTI_SEATS).map((seat) => (
                  <button
                    key={`seat-btn-${seat}`}
                    type="button"
                    onClick={() => handleSeatChange(seat)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all border ${
                      selectedSeat === seat
                        ? "bg-gradient-to-r from-brand-purple to-brand-pink text-white border-transparent font-bold"
                        : "bg-wedding-silver hover:bg-gray-100 text-gray-600 border-wedding-border"
                    }`}
                  >
                    {seat}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 italic mt-1 font-sans">
                💡 選択すると、いかにもそのタイプが叫びそうな「セリフ」が下に自動セットされます！
              </p>
            </div>
          )}
        </div>

        {/* Guest Input Details */}
        <div className="space-y-3 pt-1 border-t border-wedding-border">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-gray-500 font-mono mb-1">来賓名</label>
              <input
                type="text"
                id="guest-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="来賓名を入力"
                className="w-full bg-white border border-wedding-border rounded px-2.5 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-mono mb-1">心の叫び (状態)</label>
              <input
                type="text"
                id="guest-status-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="お祝いのセリフ"
                className="w-full bg-white border border-wedding-border rounded px-2.5 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-purple font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 font-mono mb-1">アバター絵文字</label>
            <div className="flex gap-2">
              <input
                type="text"
                id="guest-avatar-input"
                value={avatar}
                maxLength={2}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-12 bg-white border border-wedding-border rounded text-center text-lg focus:outline-none focus:border-brand-purple"
              />
              <div className="flex flex-wrap gap-1 items-center bg-white p-1.5 rounded border border-wedding-border flex-1 overflow-x-auto">
                {presetGuestAvatars.map((e) => (
                  <button
                    type="button"
                    key={`guest-preset-${e}`}
                    onClick={() => setAvatar(e)}
                    className="hover:scale-125 transition-transform text-sm"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          id="guest-add-btn"
          className="w-full bg-gradient-to-r from-brand-purple to-brand-pink text-white py-2 rounded-lg font-sans text-xs font-bold uppercase transition-all duration-200 hover:opacity-90 shadow-md flex items-center justify-center gap-1.5"
        >
          <Plus size={13} />
          <span>式場席へデプロイ！</span>
        </button>
      </form>

      {/* Guest Scroller Area */}
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 select-none">
        {guests.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-400 border border-dashed border-wedding-border rounded-xl bg-white space-y-1">
            <Smile size={24} className="mx-auto text-gray-300" />
            <p>観客席が空っぽです。</p>
            <p className="text-[10px] text-gray-400">性格タイプを選んでお祝い席に配属しましょう！</p>
          </div>
        ) : (
          guests.map((guest) => (
            <div
              key={guest.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                guest.isBug
                  ? "bg-brand-pink/5 border-brand-pink/20 hover:border-brand-pink/40"
                  : "bg-white border-wedding-border hover:border-brand-purple/40"
              } shadow-sm`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`text-xl filter ${guest.isSquished ? "scale-y-[0.25] translate-y-1 opacity-50 blur-[0.5px]" : ""}`}>
                  {guest.avatar}
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold text-wedding-dark truncate ${guest.isSquished ? "line-through text-gray-400" : ""}`}>
                      {guest.name}
                    </span>
                    {guest.typologySeat && (
                      <span className="text-[8px] bg-brand-purple/10 border border-brand-purple/20 text-brand-purple font-mono px-1 rounded uppercase">
                        {guest.typologySeat}
                      </span>
                    )}
                  </div>
                  <span className="block text-[10px] text-gray-500 truncate max-w-[200px] italic pt-0.5">
                    {guest.isSquished ? "💥 物理的に圧殺されました" : guest.status}
                  </span>
                </div>
              </div>
              
              <button
                type="button"
                id={`btn-remove-guest-${guest.id}`}
                onClick={() => onRemoveGuest(guest.id)}
                className="text-gray-400 hover:text-brand-pink p-1 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                title="強制退席"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>

      {guests.length > 0 && (
        <button
          type="button"
          id="btn-clear-guests"
          onClick={onClearGuests}
          className="w-full bg-white hover:bg-brand-pink/5 hover:text-brand-pink border border-wedding-border hover:border-brand-pink/30 text-gray-500 py-1.5 rounded-lg font-mono text-[9px] tracking-widest font-extrabold uppercase transition-all flex items-center justify-center gap-1"
        >
          <RefreshCw size={10} /> 観客席を全パージ
        </button>
      )}
    </div>
  );
};
