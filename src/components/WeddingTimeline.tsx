/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { WeddingLog, Guest } from "../types";
import { Terminal, ShieldAlert } from "lucide-react";

interface TimelineProps {
  logs: WeddingLog[];
  onClearLogs: () => void;
  guests: Guest[];
  isSecretMismon: boolean;
}

export const WeddingTimeline: React.FC<TimelineProps> = ({
  logs,
  onClearLogs,
  guests,
  isSecretMismon,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Compute LSI bug containment statistics
  const totalBugs = guests.filter((g) => g.isBug).length;
  const squishedBugs = guests.filter((g) => g.isBug && g.isSquished).length;
  const activeBugs = totalBugs - squishedBugs;
  const occupyRate = guests.length > 0 ? Math.round((activeBugs / guests.length) * 100) : 0;

  const getLogClasses = (type: string) => {
    switch (type) {
      case "love":
        return {
          bg: "bg-brand-pink/5 border-l-4 border-brand-pink",
          text: "text-brand-pink font-semibold",
          iconColor: "text-brand-pink",
        };
      case "chaos":
        return {
          bg: "bg-brand-purple/5 border-l-4 border-brand-purple",
          text: "text-brand-purple font-semibold",
          iconColor: "text-brand-purple",
        };
      case "secret":
        return {
          bg: "bg-gradient-to-r from-brand-pink/10 to-brand-cyan/5 border-l-4 border-brand-pink animate-pulse-glow-custom",
          text: "text-wedding-dark font-serif tracking-wide font-extrabold",
          iconColor: "text-brand-pink",
        };
      case "father":
        return {
          bg: "bg-brand-gold/10 border-l-4 border-brand-gold",
          text: "text-brand-gold font-bold font-mono",
          iconColor: "text-brand-gold animate-bounce",
        };
      case "info":
      default:
        return {
          bg: "bg-brand-cyan/5 border-l-4 border-brand-cyan",
          text: "text-brand-cyan font-semibold",
          iconColor: "text-brand-cyan",
        };
    }
  };

  return (
    <div id="timeline-panel" className="bg-wedding-ivory border border-wedding-border rounded-2xl p-5 space-y-4 shadow-xl flex flex-col h-full relative overflow-hidden">
      {/* Brand Visual Border */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-pink to-brand-gold"></div>

      {/* Header telemetry info */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-terminal text-brand-pink text-lg animate-pulse"></i>
          <h2 className="font-serif text-[15px] tracking-wider text-wedding-dark font-bold uppercase">式典タイムライン ＆ ログ</h2>
        </div>
        <button
          type="button"
          id="btn-clear-logs"
          onClick={onClearLogs}
          className="text-[9px] font-mono border border-wedding-border hover:border-brand-pink/50 text-gray-400 hover:text-brand-pink px-2 py-1 rounded transition-all"
        >
          LOGS CLEAR
        </button>
      </div>

      {/* Mini telemetry terminal */}
      <div className="grid grid-cols-2 gap-2 bg-wedding-silver border border-wedding-border p-3 rounded-xl font-mono text-[10px] text-gray-500 shadow-inner">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-cyan"></span>
            <span>式場支配率:</span>
            <span className={`font-bold ${occupyRate > 50 ? "text-brand-pink" : "text-[#0d9488]"}`}>
              {occupyRate}%
            </span>
          </div>
          <div className="text-[9px] text-gray-400 italic">
            (🐛アクティブ: {activeBugs} / 観客: {guests.length})
          </div>
        </div>
        
        <div className="space-y-1 border-l border-wedding-border pl-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-pink"></span>
            <span>セキュリティ:</span>
            <span className="font-bold text-gray-600">
              {isSecretMismon ? "WARNING" : "SAFE"}
            </span>
          </div>
          <div className="text-[9px] text-gray-400 truncate" title={isSecretMismon ? "首筋ねちょ署名検知中" : "通常挙式ロジック稼働中"}>
            {isSecretMismon ? "🚨 4.5倍 署名ロック稼働" : "標準セキュリティ起動中"}
          </div>
        </div>
      </div>

      {/* Interactive Logs Container */}
      <div
        ref={containerRef}
        id="logs-container"
        className="flex-1 min-h-[300px] max-h-[480px] overflow-y-auto space-y-3 pr-1 select-none"
      >
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 text-gray-400 border border-dashed border-wedding-border rounded-xl bg-wedding-silver">
            <Terminal size={24} className="mb-2 text-gray-300" />
            <p className="text-[10px] leading-relaxed">式が進行すると、こちらに挙式ログが<br/>リアルタイムに蓄積されます。</p>
          </div>
        ) : (
          logs.map((log) => {
            const style = getLogClasses(log.type);
            return (
              <div
                key={log.id}
                className={`p-3 rounded-xl border border-wedding-border transition-all hover:translate-x-1 duration-200 ${style.bg} shadow-sm`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`text-sm mt-0.5 ${style.iconColor}`}>
                    <i className={`${log.icon}`}></i>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`text-[10px] truncate uppercase font-sans tracking-wide ${style.text}`}>
                        {log.title}
                      </span>
                      <span className="font-mono text-[8px] text-gray-400 shrink-0">
                        {log.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-wedding-dark leading-normal font-sans">
                      {log.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isSecretMismon && (
        <div className="bg-brand-pink/5 border border-brand-pink/30 rounded-xl p-2.5 text-center text-[9px] text-brand-pink flex items-center justify-center gap-1.5 animate-pulse shadow-sm">
          <ShieldAlert size={12} className="animate-bounce" />
          <span>[SYSTEM] Monday研究所強制ログ修復パッチ稼働中</span>
        </div>
      )}
    </div>
  );
};
