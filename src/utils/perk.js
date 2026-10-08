/**
 * src/utils/perk.js — 入場特典の種別定義と表示スタイル
 *
 * 分類軸は GAS 側の PerkNormalizer.gs と同一。
 * GAS 側で正規化済みのデータが来るが、手動入力データの表記揺れも
 * 表示時に吸収するため、フロント側でも軽い正規化を行う。
 */

export const PERK_TYPE_STYLES = {
  '指名特典':     { color: 'pink lighten-4',      textClass: 'pink--text text--darken-3',       icon: 'mdi-heart' },
  '目当て特典':   { color: 'purple lighten-4',    textClass: 'purple--text text--darken-3',     icon: 'mdi-star' },
  '整理券':       { color: 'blue lighten-4',      textClass: 'blue--text text--darken-3',       icon: 'mdi-ticket-confirmation' },
  'チェキ':       { color: 'teal lighten-4',      textClass: 'teal--text text--darken-3',       icon: 'mdi-camera' },
  'サイン':       { color: 'orange lighten-4',    textClass: 'orange--text text--darken-3',     icon: 'mdi-pen' },
  '写メ':         { color: 'light-blue lighten-4', textClass: 'light-blue--text text--darken-3', icon: 'mdi-camera-front' },
  '生写真':       { color: 'indigo lighten-4',    textClass: 'indigo--text text--darken-3',     icon: 'mdi-image' },
  '動画':         { color: 'red lighten-4',       textClass: 'red--text text--darken-3',        icon: 'mdi-video' },
  'ポストカード': { color: 'cyan lighten-4',      textClass: 'cyan--text text--darken-3',       icon: 'mdi-email-outline' },
  'シール':       { color: 'lime lighten-4',      textClass: 'lime--text text--darken-3',       icon: 'mdi-sticker' },
  '入場特典':     { color: 'green lighten-4',     textClass: 'green--text text--darken-3',      icon: 'mdi-gift' },
  'その他':       { color: 'grey lighten-3',      textClass: 'grey--text text--darken-2',       icon: 'mdi-dots-horizontal' },
};

// 特典種別辞書（より固有の語を先に評価。gas/PerkNormalizer.gs と同じ順序）
const PERK_TYPE_KEYWORDS = [
  ['指名特典',     ['指名特典', '指名チケット', '指名権', '指名券', '指名入場特典', 'サイン入り指名', '指名']],
  ['目当て特典',   ['目当て特典', 'お目当て特典', 'お目当て', '目当て', '推し特']],
  ['整理券',       ['整理券', '優先入場券', '優先入場', '優先券', '入場整理券']],
  ['チェキ',       ['サインチェキ', 'サイン入りチェキ', '2ショットチェキ', 'ツーショットチェキ', 'チェキサイン', 'チェキ券', 'いつでもチェキ', '2ショット', 'チェキ']],
  ['サイン',       ['サイン会', 'サイン券', 'サインあり', '直筆サイン']],
  ['写メ',         ['写メ券', '写メトーク', '写メ']],
  ['生写真',       ['生写真', '生写', 'ブロマイド', 'ブロマ']],
  ['動画',         ['動画']],
  ['ポストカード', ['ポストカード', 'ポスカ', 'パチュンカード']],
  ['シール',       ['ステッカーセット', 'ステッカー', 'シール', 'スタンプ']],
  ['入場特典',     ['入場特典', '入場者特典', '入場プレゼント', '入場グッズ', 'にゅうとく', '入特', '特典券', '特典']],
];

/** 特典テキストから種別を判定（例: 「にゅうとく」→「入場特典」） */
export function normalizePerkType(text) {
  const t = String(text || '');
  for (const [type, keywords] of PERK_TYPE_KEYWORDS) {
    if (keywords.some((k) => t.includes(k))) return type;
  }
  return 'その他';
}

/** 特典テキストに対応するバッジスタイルを返す */
export function perkTypeStyle(text) {
  return PERK_TYPE_STYLES[normalizePerkType(text)] || PERK_TYPE_STYLES['その他'];
}
