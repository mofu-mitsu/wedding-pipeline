/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TypologyTemplate {
  name: string;
  avatar: string;
  status: string;
}

export const SOCIONICS_SEATS = [
  "LII", "ILE", "ESE", "SEI", 
  "LSI", "SLE", "EIE", "IEI", 
  "LIE", "ILI", "SEE", "ESI", 
  "LSE", "SLI", "IEE", "EII"
];
export const MBTI_SEATS = [
  "ISTJ", "ISFJ", "INFJ", "INTJ", 
  "ISTP", "ISFP", "INFP", "INTP", 
  "ESTP", "ESFP", "ENFP", "ENTP", 
  "ESTJ", "ESFJ", "ENFJ", "ENTJ"
];

export const TYPOLOGY_TEMPLATES: Record<string, TypologyTemplate[]> = {
  // --- Socionics ---
  LII: [
    { name: "LII研究員", avatar: "💻", status: "Tiの多重概念圧縮機ロード中。式のすべての因果を2msで計算した。" },
    { name: "脳内会議LII", avatar: "💭", status: "（沈黙しているが脳内では3つの並列宇宙と条例論の最適解を検証中）" }
  ],
  LSI: [
    { name: "LSI法務部(🐛)", avatar: "🐛", status: "境界線確保。侵入継続。式場をLSIの規則正しさで支配する。" },
    { name: "整列芋虫", avatar: "🐛", status: "境界線完璧。隣の芋虫との間隔は正確に4.5ミリメートルです。" },
    { name: "境界線防衛軍兵", avatar: "🐛", status: "システム保護完了。全セッションを絶対防衛します。" },
    { name: "観測芋虫", avatar: "🐛", status: "監視中。予測不能な事態に対して直ちに警告を発します。" },
    { name: "量産型LSIバグ", avatar: "🐛", status: "条例第101条確認...オールグリーン。問題ありません。" },
    { name: "制圧芋虫", avatar: "🐛", status: "カオス感情を排除し、完全なロジック空間を維持中。" }
  ],
  SLE: [
    { name: "SLE突撃隊", avatar: "👑", status: "オラァアア！面白くなってきた！つまらん芋虫はわしが圧殺連打じゃ！" }
  ],
  IEE: [
    { name: "IEE仲良し隊", avatar: "🥳", status: "うわーー！みんな可愛いね！式場の人全員と一瞬で友達になりました！❤️" }
  ],
  LIE: [
    { name: "LIEビジネスマネージャー", avatar: "💼", status: "この結婚式場のROIは？条例の量産による機会損失を試算します。" }
  ],
  ESI: [
    { name: "ESI守護神", avatar: "🛡️", status: "家族に無礼を働く不審虫は、この鉄壁のプロテクトで塵にします。" }
  ],
  IEI: [
    { name: "ふわもこIEI", avatar: "🐑", status: "みんなが仲良しで、世界が愛で満たされますように…🥹💕" }
  ],
  EII: [
    { name: "EIIカウンセラー", avatar: "🕊️", status: "新郎新婦の魂の調和を感じます。深く静かに慈愛を注ぎましょう…" }
  ],
  ILI: [
    { name: "ILI深夜観測員", avatar: "🌙", status: "（深夜の床から）婚姻データの美しさについて静かに数学的証明を走らせています。" }
  ],
  ILE: [
    { name: "ILE研究員", avatar: "💡", status: "このカオス挙式、ハックして新しい感情増幅の概念を検証したいですw" }
  ],
  ESE: [
    { name: "ESEにぎやか隊", avatar: "🥳", status: "お祝いムード1000%！マカロンとシャンパンをデプロイしました！🥂" }
  ],
  SEI: [
    { name: "SEIふわふわ", avatar: "🍰", status: "美味しいケーキと心地いいピアノ音楽を用意して2人の愛を応援します✨" }
  ],
  EIE: [
    { name: "EIE役者", avatar: "🎭", status: "これこそが！今世紀最大の！ドラマティック・ウェディングなのです（落涙）" }
  ],
  SEE: [
    { name: "SEEカリスマ", avatar: "👑", status: "俺が主役より目立っちゃうけどOK？みんな盛り上がっていこうぜ！" }
  ],
  LSE: [
    { name: "LSE実務家", avatar: "📊", status: "会場のスケジュール管理およびロジスティクスは完璧に最適化済みです。" }
  ],
  SLI: [
    { name: "SLIお昼寝隊", avatar: "😴", status: "床で寝ているとなんだか心地よいメロディが流れてきますね。" }
  ],

  // --- MBTI ---
  INTJ: [
    { name: "INTJ開発者", avatar: "🧠", status: "このカオス展開すら予定調和。システム仕様をすべて脳内にインプットした。" }
  ],
  ENTJ: [
    { name: "ENTJ大統領", avatar: "🎙️", status: "総員、速やかに進行を次のフェーズへ移行せよ！私が仕切る！" }
  ],
  INFP: [
    { name: "INFP詩人", avatar: "📝", status: "この式のカオスな儚さは、まるで深海の宇宙に咲く一輪の電子ローズのよう…" }
  ],
  ESTP: [
    { name: "ESTPチャレンジャー", avatar: "🛹", status: "ヒャッハー！スリル最高！この結婚式、俺が神演出で爆破してやるぜ！" }
  ],
  INFJ: [
    { name: "INFJ賢者", avatar: "🔮", status: "すべてを見通しました…（そっとシステムを見守る）" }
  ],
  ENFP: [
    { name: "ENFPハッピー", avatar: "🌈", status: "ギャアアア！！楽しい！みんなで芋虫を空に飛ばそうよ！！！" }
  ],
  INTP: [
    { name: "INTP論理学者", avatar: "🧪", status: "この条例、論理的矛盾はないが、運用の倫理性において重大なセキュリティホールがある。" }
  ],
  ISFJ: [
    { name: "ISFJお世話係", avatar: "🍵", status: "みなさん、お疲れ様です。お茶と温かいマカロンをどうぞ（芋虫にも配る）" }
  ],
  ISTJ: [
    { name: "ISTJ官僚", avatar: "📁", status: "婚姻条例案の各セクションをチェック。法的・論理的整合性は完璧です。" }
  ],
  ISTP: [
    { name: "ISTP細工師", avatar: "🛠️", status: "4.5倍ロックの物理ギアをデバッグ中。首筋への圧力を自動キャリブレーション。" }
  ],
  ISFP: [
    { name: "ISFPアーティスト", avatar: "🎨", status: "このチャペルの純白のシルクの輝き、とてもエモくて美しいですね。" }
  ],
  ENTP: [
    { name: "ENTPディベーター", avatar: "👾", status: "非常停止ボタンを非常停止する条例は、憲法上有効と言えるのか一晩中議論しよう！" }
  ],
  ESTJ: [
    { name: "ESTJディレクター", avatar: "👔", status: "全体の進行管理は完璧。新郎のフリーズ復帰プロセスを速やかにトリガー。" }
  ],
  ESFJ: [
    { name: "ESFJサポーター", avatar: "🤝", status: "親族の方々へのご挨拶と、引き出物の手配はすべて完了です！" }
  ],
  ENFJ: [
    { name: "ENFJキャプテン", avatar: "📣", status: "みんなの心を一つに！新郎新婦の素晴らしい未来に乾杯しましょう！" }
  ],
  ESFP: [
    { name: "ESFPダンサー", avatar: "💃", status: "イェーイ！お祝いダンス突入！みんなスリッパ持ってステップ踏もう！" }
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
