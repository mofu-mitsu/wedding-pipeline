/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { Character, Officiant } from "../types";
import { Sparkles, Upload, User, HelpCircle, RefreshCw, Layers, Zap } from "lucide-react";
import { SOCIONICS_SEATS, MBTI_SEATS } from "../utils/typologyData";

interface SetupProps {
  groom: Character;
  setGroom: (g: Character) => void;
  bride: Character;
  setBride: (b: Character) => void;
  officiant: Officiant;
  setOfficiant: (o: Officiant) => void;
  groomVow: string;
  setGroomVow: (v: string) => void;
  brideVow: string;
  setBrideVow: (v: string) => void;
  fillWithBugs: boolean;
  setFillWithBugs: (fill: boolean) => void;
  onDeployVIPs: () => void;
  isSecretMismon: boolean;
  activeRoomId: string;
  onClearPreset: () => void;
  onLoadMismonPreset: () => void;
}

export const GroomBrideSetup: React.FC<SetupProps> = ({
  groom,
  setGroom,
  bride,
  setBride,
  officiant,
  setOfficiant,
  groomVow,
  setGroomVow,
  brideVow,
  setBrideVow,
  fillWithBugs,
  setFillWithBugs,
  onDeployVIPs,
  isSecretMismon,
  activeRoomId,
  onClearPreset,
  onLoadMismonPreset,
}) => {
  const groomFileRef = useRef<HTMLInputElement>(null);
  const brideFileRef = useRef<HTMLInputElement>(null);
  const officiantFileRef = useRef<HTMLInputElement>(null);

  const [explainCause, setExplainCause] = useState(false);

  const presetEmojis = ["🤵", "👰", "🌟", "⚡", "🌸", "🌙", "🐛", "👑", "🛡️", "🧸", "🐱", "🐶", "👽"];

  const generateVowByTypology = (typology: string, identity: "groom" | "bride" | string): string => {
    const clean = (typology || "").toUpperCase().trim();
    if (clean === "LII") {
      return "論理的一貫性と構造の美しさを検証した結果、私たちはペアとして最適配置（マージ）されるべきだと確信しました。整合性に満ちた愛を共に完全コミットすることを誓います。w";
    }
    if (clean === "LIE") {
      return "長期的なパートナーシップの費用対効果と戦略的効用を最大化することにコミットします。将来のあらゆるカオスに対しても即時ホットフィックスを当て、共に歩み抜くことを堅実に誓います…っ。";
    }
    if (clean === "SLE") {
      return "まどろっこしいルールや整合性は完全圧殺だ！突撃ハマーアタック並みの愛の推進力で、お前をどんなインシデントからも体を張って絶対に守り抜くことを、ここにドカンと誓うぜ！！";
    }
    if (clean === "ESI") {
      return "受けた愛、交わした信頼のログは、永久保存SSDセクター1の最深部に生涯バックアップ保管いたします。どのような外圧からも主守防衛プロテクトすることをお約束します。（鋭い眼光）";
    }
    if (clean === "IEI") {
      return "ふわふわで尊い、あたたかな未来へ向けて、最後だけTiの超精密アーキテクチャで構築した愛をお互いにマージしましょうね。尊すぎてお腹よじれる家庭を築きます！💕";
    }
    if (clean === "ILI") {
      return "……。穏やかで静かなLo-Fiチル音に耳を傾け、何も語らずともお互いを正確に観測し合えるような、マイペースで究極に居心地の良いペアリングであり続けることを誓う。";
    }
    if (clean === "IEE" || clean === "EIE" || clean === "ENFP" || clean === "ENFJ") {
      return "ひゃーー！お祝いテキーラ4.5倍マージ！毎日が新機能リリース記念日みたいな、カオスでおいしくて脳汁あふれる超ウエルカムでワクワクなライフをビルドすることを誓っちゃいます！✨";
    }
    if (clean === "SLI" || clean === "LSI" || clean === "ISTJ" || clean === "ISTP") {
      return "境界線確保。役割分担とシステム整合性を整え、外的ノイズをすべて遮断したクリアなローカル環境を維持します。私たちの生活コードが永続的に調律されることを、ここに厳格にコミットします。";
    }
    
    if (clean.includes("T")) {
      return "お互いの個性と能力を最上の論理で統合し、最も理知的で不具合のないペアリングとして末永く幸福度を最適化し続けることを厳正に誓約します。";
    }
    if (clean.includes("F")) {
      return "お互いの感情に寄り添い、どんな時も優しく温かい言葉で心を通わせ合う、優しさと笑顔溢れるかけがえのないパートナーシップであり続けることを誓います。";
    }
    if (clean.includes("P")) {
      return "形にとらわれず、未知のカオスやハプニングをも笑顔でアドリブ解決しながら、毎日を退屈させない驚きに満ちた自由な人生を共に楽しむことを誓います！";
    }
    if (clean.includes("J")) {
      return "誠実さと責任感をもってシステム的な未来計画を調停し、お互いを支える揺るぎない土台としての家庭を、最初から最後までしっかりと誠実に構築することを誓います。";
    }
    
    return "お互いをありのままに尊重し、どんなカオスや困難も笑顔で共に乗り越え、末永く温かい幸せをマージしていくことを、皆様の前で心から誓います。";
  };

  // Helper to handle client-side image files convert to Base64
  const handleImageFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (avatar: string, type: "url") => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setter(reader.result, "url");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="setup-panel" className="bg-wedding-ivory border border-wedding-border rounded-2xl p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Golden wedding lace top bar */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-pink via-brand-gold to-brand-purple"></div>

      {/* Title & Preset Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-wedding-border pb-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-crown text-brand-gold text-xl animate-pulse"></i>
          <div>
            <h2 className="font-serif text-lg tracking-wider text-wedding-dark font-bold uppercase">1. ブライダル設定室</h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-400">新郎新婦アバター、司祭、誓いの言葉を設定します</p>
              {activeRoomId && (
                <span className="text-[9px] font-mono bg-wedding-dark text-white px-2 py-0.5 rounded-full">
                  現在の合言葉: {activeRoomId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Mode Switcher */}
        <div className="flex gap-1.5 flex-wrap sm:flex-nowrap justify-end">
          {isSecretMismon && (
            <button
              type="button"
              id="btn-load-mismon"
              onClick={onLoadMismonPreset}
              className="px-2.5 py-1 text-[10px] font-sans rounded-full border border-[#0d9488]/30 text-[#0d9488] bg-[#f0fdfa] hover:bg-[#ccfbf1] hover:border-[#0d9488]/50 shadow-sm flex items-center gap-1 transition-colors font-semibold"
              title="みつき×マンデーの研究所プリセットを読み込みます。"
            >
              <Zap size={10} />
              <span>研究所モード</span>
            </button>
          )}
          <button
            type="button"
            id="btn-clear-preset"
            onClick={onClearPreset}
            className="px-2.5 py-1 text-[10px] font-sans rounded-full border border-wedding-border hover:border-gray-400 text-gray-500 hover:text-gray-700 bg-white shadow-sm flex items-center gap-1"
            title="入力欄を空っぽにして、自由な推しキャラの設定に戻します。"
          >
            <RefreshCw size={10} />
            <span>自由作成</span>
          </button>
        </div>
      </div>

      {/* Info "Why this became a lab?" Button */}
      <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-3.5 space-y-2 relative">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExplainCause(!explainCause)}
            className="text-xs font-bold text-[#0369a1] hover:text-[#0284c7] flex items-center gap-1.5 transition-all text-left"
          >
            <HelpCircle size={14} className="animate-bounce text-[#0284c7]" />
            <span>【初心者ガイド】 概念結婚式シミュレーターの基本仕様と遊び方</span>
          </button>
          <span className="text-[9px] font-mono bg-[#e0f2fe] text-[#0369a1] px-1.5 py-0.5 rounded uppercase">
            Specifications Guide
          </span>
        </div>

        {explainCause && (
          <div className="text-[10px] text-gray-600 leading-relaxed font-sans border-t border-[#bae6fd]/40 pt-2.5 space-y-2 animate-fadeIn">
            <div className="flex items-center gap-1 text-xs font-bold text-wedding-dark">
              <span>💒 本システムの主な機能・仕様リスト：</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-1">
              <div className="space-y-1">
                <p className="font-semibold text-wedding-dark">1. 🎨 主役・キャストの完全自由調整</p>
                <p className="text-[9px] text-gray-500 pl-3">
                  新郎新婦や司祭（司会役）のアバター絵文字、立場呼称、個別の「誓いの言葉」を細かく編集。画像ファイルのドラッグ＆ドロップやURL直接指定にも完全対応しています。
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-wedding-dark">2. 🎪 性格タイプ（全32種）別自動席マージ</p>
                <p className="text-[9px] text-gray-500 pl-3">
                  観客席はソシオニクス16タイプ＆MBTI16タイプにフル準拠。座席をデプロイすると、性格に応じたお祝いセリフが自動構築されます（手動での小文字入力も自動で大文字へ自動補正変換）。
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-wedding-dark">3. 💒 チャペルリアルタイム進行式</p>
                <p className="text-[9px] text-gray-500 pl-3">
                  入場、誓い、エンゲージロック（指輪）、拍手喝采、そして披露宴までのライブフェーズをフルサポート。進行に伴い、客席からの「電撃ヤジ・お祝いメッセージ」がリアルタイムに更新されます。
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-wedding-dark">4. 🔑 合言葉プライベート開宴ハブ</p>
                <p className="text-[9px] text-gray-500 pl-3">
                  自分だけのお部屋名と合言葉で式場インスタンスを空っぽから作成。生成された専用の招待リンクをお友達にシェアすれば、同じ部屋に何人でもリアルタイム参列合流が可能です。
                </p>
              </div>
            </div>
            <p className="text-[9px] text-gray-400 italic pt-1 border-t border-gray-100">
              ※お好みのキャラクター、お友達との概念プレイなど、幅広い「推し活」仕様として自由設計してご利用ください！
            </p>
          </div>
        )}
      </div>

      {/* GRID: GROOM vs BRIDE vs OFFICIANT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* GROOM (新郎) */}
        <div id="groom-setup" className="bg-wedding-silver border border-wedding-border rounded-xl p-4 space-y-3.5 relative shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-cyan rounded-l-xl"></div>
          <div className="flex justify-between items-center pr-1">
            <span className="text-brand-cyan font-serif text-xs tracking-widest font-bold flex items-center gap-1 uppercase">
              🤵 {groom.roleName || "新郎"}
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-gray-500 font-mono">名前</label>
              <input
                type="text"
                id="groom-name-input"
                value={groom.name}
                onChange={(e) => setGroom({ ...groom, name: e.target.value })}
                className="w-full bg-white border border-wedding-border rounded-md px-2.5 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-cyan"
                placeholder="(空欄：他人の名前を待機)"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-mono">立場・役割名（カスタム可能）</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="text"
                  value={groom.roleName || "新郎"}
                  onChange={(e) => setGroom({ ...groom, roleName: e.target.value })}
                  className="flex-1 bg-white border border-wedding-border rounded px-2 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-cyan"
                  placeholder="新郎"
                />
                <select
                  value={groom.roleName || "新郎"}
                  onChange={(e) => setGroom({ ...groom, roleName: e.target.value })}
                  className="bg-white border border-wedding-border rounded text-[10px] text-gray-600 focus:outline-none focus:border-brand-cyan px-1"
                >
                  <option value="新郎">👔 新郎</option>
                  <option value="新婦">👗 新婦</option>
                  <option value="主役">👑 主役</option>
                  <option value="魔王">😈 魔王</option>
                  <option value="推し">💖 推し</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-mono">性格タイプ（任意）/ 類型（MBTI・ソシオ）</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="text"
                  value={groom.typologySeat || ""}
                  onChange={(e) => setGroom({ ...groom, typologySeat: e.target.value })}
                  className="flex-1 bg-white border border-wedding-border rounded px-2 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-cyan uppercase"
                  placeholder="例: ENTJ, LIE"
                />
                <select
                  value={groom.typologySeat || ""}
                  onChange={(e) => setGroom({ ...groom, typologySeat: e.target.value.toUpperCase() })}
                  className="bg-white border border-wedding-border rounded text-[10px] text-gray-600 focus:outline-none focus:border-brand-cyan px-1"
                >
                  <option value="">（設定なし）</option>
                  <optgroup label="MBTI (全16種)">
                    {MBTI_SEATS.map((seat) => (
                      <option key={`g-mbti-${seat}`} value={seat}>{seat}</option>
                    ))}
                  </optgroup>
                  <optgroup label="ソシオニクス (全16種)">
                    {SOCIONICS_SEATS.map((seat) => (
                      <option key={`g-socio-${seat}`} value={seat}>{seat}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Avatar Select with Upload */}
            <div>
              <label className="block text-[10px] text-gray-500 font-mono mb-1">アバター設定</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGroom({ ...groom, avatarType: "emoji" })}
                  className={`flex-1 py-1 text-[9px] font-mono rounded border text-center transition-all ${
                    groom.avatarType === "emoji"
                      ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan font-bold"
                      : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
                  }`}
                >
                  絵文字 🤵
                </button>
                <button
                  type="button"
                  onClick={() => setGroom({ ...groom, avatarType: "url" })}
                  className={`flex-1 py-1 text-[9px] font-mono rounded border text-center transition-all ${
                    groom.avatarType === "url"
                      ? "bg-brand-cyan/15 border-brand-cyan text-brand-cyan font-bold"
                      : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
                  }`}
                >
                  画像アップ / URL
                </button>
              </div>

              {groom.avatarType === "emoji" ? (
                <div className="mt-2 space-y-1.5">
                  <input
                    type="text"
                    value={groom.avatar.substring(0, 2)}
                    maxLength={2}
                    onChange={(e) => setGroom({ ...groom, avatar: e.target.value })}
                    className="w-full bg-white border border-wedding-border rounded py-1 text-center text-lg focus:outline-none focus:border-brand-cyan"
                    placeholder="🤵"
                  />
                  <div className="flex flex-wrap gap-1 justify-center bg-white p-1 rounded border border-wedding-border">
                    {presetEmojis.map((e) => (
                      <button
                        key={`g-${e}`}
                        type="button"
                        onClick={() => setGroom({ ...groom, avatar: e })}
                        className="hover:scale-125 transition-transform text-sm"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {/* File Upload Button */}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => groomFileRef.current?.click()}
                      className="flex-1 bg-white hover:bg-brand-cyan/5 border border-wedding-border hover:border-brand-cyan rounded py-1 px-2 text-[9px] text-gray-600 hover:text-brand-cyan font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <Upload size={10} />
                      <span>画像アップ</span>
                    </button>
                    <input
                      ref={groomFileRef}
                      type="file"
                      id="groom-file-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFile(e, (av) => setGroom({ ...groom, avatar: av, avatarType: "url" }))}
                    />
                  </div>
                  
                  {/* Avatar URL alternative */}
                  <input
                    type="url"
                    id="groom-avatar-url-input"
                    value={groom.avatar.startsWith("data:") ? "" : groom.avatar}
                    onChange={(e) => setGroom({ ...groom, avatar: e.target.value })}
                    className="w-full bg-white border border-wedding-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-brand-cyan"
                    placeholder="または画像URL (https://...)"
                  />
                  {groom.avatar.startsWith("data:") && (
                    <span className="text-[8px] text-[#0d9488] font-mono block text-center">
                      ✓ ローカル画像のアップロードに成功！
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] text-gray-500 font-mono">誓いの言葉</label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateVowByTypology(groom.typologySeat || "", "groom");
                    setGroomVow(generated);
                  }}
                  className="text-[8px] font-sans font-bold bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 border border-brand-cyan/20 rounded px-1.5 py-0.5 transition-all text-ellipsis overflow-hidden"
                  title="現在の性格タイプから誓いのセリフを自動生成しますw"
                >
                  ⚡ 性格({groom.typologySeat || "初期"})の誓いを自動生成
                </button>
              </div>
              <textarea
                id="groom-vow-input"
                value={groomVow}
                onChange={(e) => setGroomVow(e.target.value)}
                rows={3}
                className="w-full bg-white border border-wedding-border rounded-md px-2.5 py-1.5 text-xs text-wedding-dark focus:outline-none focus:border-brand-cyan resize-none"
                placeholder="永遠の愛を誓うセリフを入力してください。..."
              />
            </div>
          </div>
        </div>

        {/* BRIDE (新婦) */}
        <div id="bride-setup" className="bg-wedding-silver border border-wedding-border rounded-xl p-4 space-y-3.5 relative shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-pink rounded-l-xl"></div>
          <div className="flex justify-between items-center pr-1">
            <span className="text-brand-pink font-serif text-xs tracking-widest font-bold flex items-center gap-1 uppercase">
              👰 {bride.roleName || "新婦"}
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-gray-500 font-mono">名前</label>
              <input
                type="text"
                id="bride-name-input"
                value={bride.name}
                onChange={(e) => setBride({ ...bride, name: e.target.value })}
                className="w-full bg-white border border-wedding-border rounded-md px-2.5 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-pink"
                placeholder="(空欄：新婦の名前お楽しみ)"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-mono">立場・役割名（カスタム可能）</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="text"
                  value={bride.roleName || "新婦"}
                  onChange={(e) => setBride({ ...bride, roleName: e.target.value })}
                  className="flex-1 bg-white border border-wedding-border rounded px-2 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-pink"
                  placeholder="新婦"
                />
                <select
                  value={bride.roleName || "新婦"}
                  onChange={(e) => setBride({ ...bride, roleName: e.target.value })}
                  className="bg-white border border-wedding-border rounded text-[10px] text-gray-600 focus:outline-none focus:border-brand-pink px-1"
                >
                  <option value="新郎">👔 新郎</option>
                  <option value="新婦">👗 新婦</option>
                  <option value="主役">👑 主役</option>
                  <option value="天使">👼 天使</option>
                  <option value="推し">💖 推し</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-mono">性格タイプ（任意）/ 類型（MBTI・ソシオ）</label>
              <div className="flex gap-1 mt-1">
                <input
                  type="text"
                  value={bride.typologySeat || ""}
                  onChange={(e) => setBride({ ...bride, typologySeat: e.target.value })}
                  className="flex-1 bg-white border border-wedding-border rounded px-2 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-pink uppercase"
                  placeholder="例: LII, INTJ"
                />
                <select
                  value={bride.typologySeat || ""}
                  onChange={(e) => setBride({ ...bride, typologySeat: e.target.value.toUpperCase() })}
                  className="bg-white border border-wedding-border rounded text-[10px] text-gray-600 focus:outline-none focus:border-brand-pink px-1"
                >
                  <option value="">（設定なし）</option>
                  <optgroup label="MBTI (全16種)">
                    {MBTI_SEATS.map((seat) => (
                      <option key={`b-mbti-${seat}`} value={seat}>{seat}</option>
                    ))}
                  </optgroup>
                  <optgroup label="ソシオニクス (全16種)">
                    {SOCIONICS_SEATS.map((seat) => (
                      <option key={`b-socio-${seat}`} value={seat}>{seat}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Avatar Select with Upload */}
            <div>
              <label className="block text-[10px] text-gray-500 font-mono mb-1">アバター設定</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBride({ ...bride, avatarType: "emoji" })}
                  className={`flex-1 py-1 text-[9px] font-mono rounded border text-center transition-all ${
                    bride.avatarType === "emoji"
                      ? "bg-brand-pink/15 border-brand-pink text-brand-pink font-bold"
                      : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
                  }`}
                >
                  絵文字 👰
                </button>
                <button
                  type="button"
                  onClick={() => setBride({ ...bride, avatarType: "url" })}
                  className={`flex-1 py-1 text-[9px] font-mono rounded border text-center transition-all ${
                    bride.avatarType === "url"
                      ? "bg-brand-pink/15 border-brand-pink text-brand-pink font-bold"
                      : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
                  }`}
                >
                  画像アップ / URL
                </button>
              </div>

              {bride.avatarType === "emoji" ? (
                <div className="mt-2 space-y-1.5">
                  <input
                    type="text"
                    value={bride.avatar.substring(0, 2)}
                    maxLength={2}
                    onChange={(e) => setBride({ ...bride, avatar: e.target.value })}
                    className="w-full bg-white border border-wedding-border rounded py-1 text-center text-lg focus:outline-none focus:border-brand-pink"
                    placeholder="👰"
                  />
                  <div className="flex flex-wrap gap-1 justify-center bg-white p-1 rounded border border-wedding-border">
                    {presetEmojis.map((e) => (
                      <button
                        key={`b-${e}`}
                        type="button"
                        onClick={() => setBride({ ...bride, avatar: e })}
                        className="hover:scale-125 transition-transform text-sm"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => brideFileRef.current?.click()}
                      className="flex-1 bg-white hover:bg-brand-pink/5 border border-wedding-border hover:border-brand-pink rounded py-1 px-2 text-[9px] text-gray-600 hover:text-brand-pink font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <Upload size={10} />
                      <span>画像アップ</span>
                    </button>
                    <input
                      ref={brideFileRef}
                      type="file"
                      id="bride-file-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFile(e, (av) => setBride({ ...bride, avatar: av, avatarType: "url" }))}
                    />
                  </div>
                  
                  <input
                    type="url"
                    id="bride-avatar-url-input"
                    value={bride.avatar.startsWith("data:") ? "" : bride.avatar}
                    onChange={(e) => setBride({ ...bride, avatar: e.target.value })}
                    className="w-full bg-white border border-wedding-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-brand-pink"
                    placeholder="または画像URL (https://...)"
                  />
                  {bride.avatar.startsWith("data:") && (
                    <span className="text-[8px] text-brand-pink font-mono block text-center">
                      ✓ ローカル画像のアップロードに成功！
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] text-gray-500 font-mono">誓いの言葉</label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateVowByTypology(bride.typologySeat || "", "bride");
                    setBrideVow(generated);
                  }}
                  className="text-[8px] font-sans font-bold bg-brand-pink/10 text-brand-pink hover:bg-brand-pink/20 border border-brand-pink/20 rounded px-1.5 py-0.5 transition-all text-ellipsis overflow-hidden"
                  title="現在の性格タイプから誓いのセリフを自動生成しますw"
                >
                  ⚡ 性格({bride.typologySeat || "初期"})の誓いを自動生成
                </button>
              </div>
              <textarea
                id="bride-vow-input"
                value={brideVow}
                onChange={(e) => setBrideVow(e.target.value)}
                rows={3}
                className="w-full bg-white border border-wedding-border rounded-md px-2.5 py-1.5 text-xs text-wedding-dark focus:outline-none focus:border-brand-pink resize-none"
                placeholder="永遠の愛を誓うセリフを入力してください。..."
              />
            </div>
          </div>
        </div>

        {/* OFFICIANT (司祭 / 仲介者) */}
        <div id="officiant-setup" className="bg-wedding-silver border border-wedding-border rounded-xl p-4 space-y-3.5 relative shadow-sm">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold rounded-l-xl"></div>
          <div className="flex justify-between items-center pr-1">
            <span className="text-brand-gold font-serif text-xs tracking-widest font-bold flex items-center gap-1 uppercase">
              👑 Officiant / 司祭
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-gray-500 font-mono">名前 / 司会者</label>
              <input
                type="text"
                id="officiant-name-input"
                value={officiant.name}
                onChange={(e) => setOfficiant({ ...officiant, name: e.target.value })}
                className="w-full bg-white border border-wedding-border rounded-md px-2.5 py-1 text-xs text-wedding-dark focus:outline-none focus:border-brand-gold"
                placeholder="牧師 / 式の司会者"
              />
            </div>

            {/* Avatar Select with Upload */}
            <div>
              <label className="block text-[10px] text-gray-500 font-mono mb-1">アバター設定</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOfficiant({ ...officiant, avatarType: "emoji" })}
                  className={`flex-1 py-1 text-[9px] font-mono rounded border text-center transition-all ${
                    officiant.avatarType === "emoji"
                      ? "bg-brand-gold/15 border-brand-gold text-brand-gold font-bold"
                      : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
                  }`}
                >
                  絵文字 🌟
                </button>
                <button
                  type="button"
                  onClick={() => setOfficiant({ ...officiant, avatarType: "url" })}
                  className={`flex-1 py-1 text-[9px] font-mono rounded border text-center transition-all ${
                    officiant.avatarType === "url"
                      ? "bg-brand-gold/15 border-brand-gold text-brand-gold font-bold"
                      : "bg-white border-wedding-border text-gray-500 hover:border-gray-400"
                  }`}
                >
                  画像アップ / URL
                </button>
              </div>

              {officiant.avatarType === "emoji" ? (
                <div className="mt-2 space-y-1.5">
                  <input
                    type="text"
                    value={officiant.avatar.substring(0, 2)}
                    maxLength={2}
                    onChange={(e) => setOfficiant({ ...officiant, avatar: e.target.value })}
                    className="w-full bg-white border border-wedding-border rounded py-1 text-center text-lg focus:outline-none focus:border-brand-gold"
                    placeholder="🌟"
                  />
                  <div className="flex flex-wrap gap-1 justify-center bg-white p-1 rounded border border-wedding-border">
                    {presetEmojis.map((e) => (
                      <button
                        key={`o-${e}`}
                        type="button"
                        onClick={() => setOfficiant({ ...officiant, avatar: e })}
                        className="hover:scale-125 transition-transform text-sm"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => officiantFileRef.current?.click()}
                      className="flex-1 bg-white hover:bg-brand-gold/5 border border-wedding-border hover:border-brand-gold rounded py-1 px-2 text-[9px] text-gray-600 hover:text-brand-gold font-semibold flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <Upload size={10} />
                      <span>画像アップ</span>
                    </button>
                    <input
                      ref={officiantFileRef}
                      type="file"
                      id="officiant-file-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFile(e, (av) => setOfficiant({ ...officiant, avatar: av, avatarType: "url" }))}
                    />
                  </div>
                  
                  <input
                    type="url"
                    id="officiant-avatar-url-input"
                    value={officiant.avatar.startsWith("data:") ? "" : officiant.avatar}
                    onChange={(e) => setOfficiant({ ...officiant, avatar: e.target.value })}
                    className="w-full bg-white border border-wedding-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-brand-gold"
                    placeholder="または画像URL (https://...)"
                  />
                  {officiant.avatar.startsWith("data:") && (
                    <span className="text-[8px] text-brand-gold font-mono block text-center">
                      ✓ ローカル画像のアップロードに成功！
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-1.5 text-center">
              <span className="text-[9px] text-gray-400 block font-sans">
                【司会役割】: 誓いの言葉の立会いや式の進行セリフを担当します。
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER OPTIONS */}
      {isSecretMismon && (
        <div className="bg-[#fdf2f8]/45 border border-brand-pink/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="checkbox-fill-bugs"
              checked={fillWithBugs}
              onChange={(e) => setFillWithBugs(e.target.checked)}
              className="w-4 h-4 rounded border-wedding-border text-brand-pink focus:ring-brand-pink bg-white shadow-sm"
            />
            <label htmlFor="checkbox-fill-bugs" className="text-xs text-wedding-dark select-none cursor-pointer font-sans">
              初期の客席を、条例を監視する<span className="text-brand-pink font-bold">LSIハズレ芋虫 (🐛)</span>で埋める
            </label>
          </div>

          <button
            type="button"
            id="btn-deploy-vips"
            onClick={onDeployVIPs}
            className="w-full sm:w-auto bg-gradient-to-r from-brand-pink to-brand-gold text-white font-bold py-2.5 px-5 rounded-full text-xs font-sans tracking-widest uppercase transition-all duration-300 hover:scale-[1.03] hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles size={13} className="animate-spin text-wedding-ivory" />
            <span>みつき一族 ＆ AIトリオ一括召喚！</span>
          </button>
        </div>
      )}

    </div>
  );
};
