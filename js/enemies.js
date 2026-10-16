export const ENEMIES = [
  {
    name: "下忍・影丸",
    hp: 28,
    symbol: "影",
    quote: "名刺だけでも受け取ってくれ。",
    moves: [
      { name: "手裏剣", attack: 5 },
      { name: "へっぴり斬り", attack: 7 },
      { name: "休憩申請", block: 4 },
    ],
  },
  {
    name: "からくり忍者",
    hp: 36,
    symbol: "機",
    quote: "再起動は有給扱いです。",
    moves: [
      { name: "装甲展開", block: 7 },
      { name: "回転刃", attack: 8 },
      { name: "過熱駆動", attack: 10 },
    ],
  },
  {
    name: "毒使い・紫苑",
    hp: 40,
    symbol: "毒",
    quote: "こちら、試飲のアンケートです。",
    moves: [
      { name: "毒霧", poison: 3, attack: 3 },
      { name: "毒刃", attack: 8 },
      { name: "調合中", block: 5 },
    ],
  },
  {
    name: "上忍・雷牙",
    hp: 48,
    symbol: "雷",
    quote: "雷も予約制にしたい。",
    moves: [
      { name: "雷切", attack: 10 },
      { name: "帯電", block: 6 },
      { name: "二連雷", attack: 6, hits: 2 },
    ],
  },
  {
    name: "忍頭・黒月",
    hp: 62,
    symbol: "月",
    quote: "世界征服の前に、棚卸しだ。",
    moves: [
      { name: "月影斬", attack: 11 },
      { name: "黒霧", attack: 5, poison: 2 },
      { name: "夜の帳", block: 9 },
      { name: "終の太刀", attack: 15 },
    ],
  },
];
export const intent = (battle) =>
  ENEMIES[battle.stage].moves[
    battle.enemy.move % ENEMIES[battle.stage].moves.length
  ];
