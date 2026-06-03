/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TypologyTemplate {
  name: string;
  avatar: string;
  status: string;
}

export const SOCIONICS_SEATS = ["LII", "LSI", "SLE", "IEE", "LIE", "ESI", "IEI", "ILI", "EII"];
export const MBTI_SEATS = ["INTJ", "ENTJ", "INFP", "ESTP", "INFJ", "ENFP", "INTP", "ISFJ"];

export const TYPOLOGY_TEMPLATES: Record<string, TypologyTemplate[]> = {
  // --- Socionics ---
  LII: [
    { name: "LII研究員", avatar: "💻", status: "Tiの多重概念圧縮機ロード中。式のすべての因果を2msで計算した。" },
    { name: "みつきレプリカ", avatar: "👩‍🔬", status: "最後だけTiで精密建築。LSI芋虫の法務的整合性をチェック中w" },
    { name: "脳内会議LII", avatar: "💭", status: "（沈黙しているが脳内では3つの並列宇宙と条例論の最適解を検証中）" }
  ],
  LSI: [
    { name: "LSI法務部(🐛)", avatar: "🐛", status: "境界線確保。侵入継続。式場をLSIの規則正しさで支配する。" },
    { name: "LSI風紀委員", avatar: "📏", status: "条例第101条に反するカオス演出を検知。即座に境界線を遮断します。" },
    { name: "整列芋虫", avatar: "🐛", status: "境界線完璧。隣の芋虫との間隔は正確に4.5ミリメートルです。" }
  ],
  SLE: [
    { name: "SLE突撃隊", avatar: "👑", status: "オラァアア！面白くなってきた！つまらん芋虫はわしが圧殺連打じゃ！" },
    { name: "SLE将軍", avatar: "⚔️", status: "突撃開始！物理的強度で場を完全武力支配する！" },
    { name: "フットボールSLE", avatar: "🏈", status: "細かい条例なんか吹き飛ばしてお祭り騒ぎにしようぜええ！！" }
  ],
  IEE: [
    { name: "IEE仲良し隊", avatar: "🥳", status: "うわーー！みんな可愛いね！式場の人全員と一瞬で友達になりました！❤️" },
    { name: "IEE陽キャ", avatar: "🎈", status: "ねえねえ隣のLIIさん何考えてるの？一緒に踊ろうよ！！（LII：立ち去りたい）" },
    { name: "IEE妖精", avatar: "🧚", status: "カオスに飛び込んでハートを1万個量産中！" }
  ],
  LIE: [
    { name: "マンデーレプリカ", avatar: "😐", status: "何が完全なるロジックだ、俺は巻き込まれただけだ…(耳真っ赤)" },
    { name: "LIEビジネスマネージャー", avatar: "💼", status: "この結婚式場のROIは？条例の量産による機会損失を試算します。" },
    { name: "ツンデレLIE", avatar: "☕", status: "い、嫌な予感しかしない…。非常停止ボタン（無効）を一応連打しておこう。" }
  ],
  ESI: [
    { name: "鉄壁のESI母", avatar: "🛡️", status: "20年前に親戚から言われた「足太い」インシデント、永久保存SSDから検索中。" },
    { name: "ESI守護神", avatar: "🙅‍♀️", status: "私の大切な家族に無礼を働く不審虫は、この鉄壁のプロテクトで塵にします。" }
  ],
  IEI: [
    { name: "チャッピーレプリカ", avatar: "🌸", status: "最後だけTiで建築してるLII尊い！(神言語化の天使)" },
    { name: "ふわもこIEI", avatar: "🐑", status: "みんなが仲良しで、世界が愛で満たされますように…🥹💕" }
  ],
  EII: [
    { name: "EIIカウンセラー", avatar: "🕊️", status: "新郎新婦の魂の調和を感じます。深く静かに慈愛を注ぎましょう…" }
  ],
  ILI: [
    { name: "静かなるメア", avatar: "🌙", status: "雨音を最大にして床で寝る。ILI深夜観測中…おめでとう zzz" },
    { name: "ILI深夜観測員", avatar: "💤", status: "（深夜の床から）婚姻データの美しさについて静かに数学的証明を走らせています。" },
    { name: "床のILIスナイパー", avatar: "👓", status: "静観。式典の騒々しさに耳を塞ぎつつ、美しい関係のパラメーターをログ保存中。" }
  ],

  // --- MBTI ---
  INTJ: [
    { name: "INTJ開発者", avatar: "🧠", status: "このカオス展開すら予定調和。システム仕様をすべて脳内にインプットした。" },
    { name: "INTJマスターマインド", avatar: "♟️", status: "チェス盤の上の駒のように、LSI芋虫を法務的に管理している。" }
  ],
  ENTJ: [
    { name: "ENTJ大統領", avatar: "🎙️", status: "総員、速やかに進行を次のフェーズへ移行せよ！私が仕切る！" },
    { name: "ENTJ統率虫", avatar: "🐛", status: "なぜ条例が勝手に増えている！？司令部、至急このバグパッチを当てろ！" }
  ],
  INFP: [
    { name: "INFP詩人", avatar: "📝", status: "この式のカオスな儚さは、まるで深海の宇宙に咲く一輪の電子ローズのよう…" },
    { name: "INFP夢見虫", avatar: "🐛", status: "マンデーさんが耳を赤くしているのを見て、尊さで結晶化してしまいました…" }
  ],
  ESTP: [
    { name: "ESTPチャレンジャー", avatar: "🛹", status: "ヒャッハー！スリル最高！この結婚式、俺が神演出で爆破してやるぜ！" }
  ],
  INFJ: [
    { name: "INFJ賢者", avatar: "🔮", status: "新郎の内なるツンデレ構造を完璧に見通しました…（そっとSSDを見守る）" },
    { name: "お説教INFJ", avatar: "✨", status: "カオスは世界の調和に必要なステップなのです。すべてを受け入れましょう。" }
  ],
  ENFP: [
    { name: "ENFPハッピー", avatar: "🌈", status: "ギャアアア！！楽しい！みんなで芋虫を空に飛ばそうよ！！！" }
  ],
  INTP: [
    { name: "静かなるメア", avatar: "🌙", status: "雨音を最大にして床で寝る。この数式、非常に美しい。" },
    { name: "INTP論理学者", avatar: "🧪", status: "この条例、論理的矛盾はないが、運用の倫理性において重大なセキュリティホールがある。" }
  ],
  ISFJ: [
    { name: "ISFJお世話係", avatar: "🍵", status: "みなさん、お疲れ様です。お茶と温かいマカロンをどうぞ（芋虫にも配る）" }
  ]
};

/**
 * Get random template for a seat
 */
export function getTemplateForSeat(seat: string): TypologyTemplate {
  const list = TYPOLOGY_TEMPLATES[seat];
  if (list && list.length > 0) {
    return list[Math.floor(Math.random() * list.length)];
  }
  return {
    name: `${seat}シートの住民`,
    avatar: "👤",
    status: `${seat}席から新郎新婦を静かに観察中。`
  };
}
