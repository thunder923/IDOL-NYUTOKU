/**
 * PerkNormalizer.gs — 入場特典（にゅうとく）情報の表記揺れ吸収・正規化ユーティリティ
 *
 * Grok 抽出結果・手動入力・Googleフォーム入力のすべてをこの関数で正規化し、
 * スプレッドシートへは統一フォーマットで保存する。
 *
 * 【吸収する表記揺れの例】
 *   にゅうとく / 入特 / 入場プレゼント / 入場者特典   → 入場特典
 *   指名 / 指名チケット / 指名権 / 指名入場特典       → 指名特典
 *   目当て / お目当て / 目当て特典 / 推し特         → 目当て特典
 *   整理券 / 優先入場 / 優先券                      → 整理券
 *   サインチェキ / チェキサイン券 / 2ショット / チェキ → チェキ
 *   サインあり / サイン券 / サイン会                → サイン
 *   写メ / 写メ券 / 写メトーク                      → 写メ
 *   生写 / ブロマ / ブロマイド / 生写真              → 生写真
 *   15分動画 / 15秒動画 / 動画                      → 動画
 *   ポスカ / パチュンカード                         → ポストカード
 *   ステッカー / スタンプ                          → シール
 *   開場10:00 / 開場 10時 / 開場１０：００          → 開場 10:00
 */

// ------------------------------------------------------------
// 特典種別辞書（より固有の語を先に評価すること）
// ------------------------------------------------------------
var PERK_TYPE_DICT = [
  { type: '指名特典',     keywords: ['指名特典', '指名チケット', '指名権', '指名券', '指名入場特典', 'サイン入り指名', '指名'] },
  { type: '目当て特典',   keywords: ['目当て特典', 'お目当て特典', 'お目当て', '目当て', '推し特'] },
  { type: '整理券',       keywords: ['整理券', '優先入場券', '優先入場', '優先券', '入場整理券'] },
  { type: 'チェキ',       keywords: ['サインチェキ', 'サイン入りチェキ', '2ショットチェキ', 'ツーショットチェキ', 'チェキサイン', 'チェキ券', 'いつでもチェキ', '2ショット', 'チェキ'] },
  { type: 'サイン',       keywords: ['サイン会', 'サイン券', 'サインあり', '直筆サイン'] },
  { type: '写メ',         keywords: ['写メ券', '写メトーク', '写メ'] },
  { type: '生写真',       keywords: ['生写真', '生写', 'ブロマイド', 'ブロマ'] },
  { type: '動画',         keywords: ['動画'] },
  { type: 'ポストカード', keywords: ['ポストカード', 'ポスカ', 'パチュンカード'] },
  { type: 'シール',       keywords: ['ステッカーセット', 'ステッカー', 'シール', 'スタンプ'] },
  { type: '入場特典',     keywords: ['入場特典', '入場者特典', '入場プレゼント', '入場グッズ', 'にゅうとく', '入特', '特典券', '特典'] }
];

// ------------------------------------------------------------
// ヘルパー
// ------------------------------------------------------------

/** 全角英数・記号を半角に変換（※ 全角チルダ「〜」はそのまま残す） */
function toHalfWidth_(str) {
  return String(str || '')
    .replace(/[！-～]/g, function (c) {
      return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    })
    .replace(/　/g, ' ');
}

/** 重複検知用のキー（全角半角・空白・括弧・記号を吸収して正規化） */
function normalizeKey_(str) {
  var s = toHalfWidth_(str);
  try { s = s.normalize('NFKC'); } catch (e) { /* NFKC非対応環境ではスキップ */ }
  return s
    .toLowerCase()
    .replace(/[\s【】\[\]()（）「」『』・!！?？,，.．。、:：~〜-]/g, '');
}

function pad2_(n) {
  n = String(n);
  return n.length < 2 ? '0' + n : n;
}

/**
 * 日付セル/文字列を Date（00:00）に変換。解釈不能なら null。
 * 対応: Dateオブジェクト / 'YYYY-MM-DD' / 'YYYY/M/D' / 'YYYY.M.D' / 'M月D日'
 */
function toDate_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) {
    return isNaN(v.getTime()) ? null : new Date(v.getFullYear(), v.getMonth(), v.getDate());
  }
  var s = String(v).trim().replace(/\./g, '-').replace(/\//g, '-');
  var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  // 「10月9日」「10月9日(土)」などの簡易対応（年は当年）
  m = s.match(/(\d{1,2})月(\d{1,2})日?/);
  if (m) {
    var now = new Date();
    return new Date(now.getFullYear(), +m[1] - 1, +m[2]);
  }
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 開催日を 'YYYY-MM-DD' に正規化（解釈不能なら ''） */
function normalizeEventDate_(v) {
  var d = toDate_(v);
  if (!d) return '';
  return d.getFullYear() + '-' + pad2_(d.getMonth() + 1) + '-' + pad2_(d.getDate());
}

// ------------------------------------------------------------
// 個別の正規化関数
// ------------------------------------------------------------

/** 特典テキストから種別を判定（例: 「にゅうとく」→「入場特典」） */
function normalizePerkType(perkText) {
  var text = toHalfWidth_(perkText || '');
  for (var i = 0; i < PERK_TYPE_DICT.length; i++) {
    var keywords = PERK_TYPE_DICT[i].keywords;
    for (var j = 0; j < keywords.length; j++) {
      if (text.indexOf(keywords[j]) !== -1) {
        return PERK_TYPE_DICT[i].type;
      }
    }
  }
  return 'その他';
}

/**
 * 特典テキストから枚数・種類数を抽出
 * 戻り値: { count: 数値|null, variety: 数値|null, note: 文字列 }
 *   例: 「ランダム3種から1枚」→ { count: 1, variety: 3, note: 'ランダム3種から1枚' }
 */
function extractPerkCount(perkText) {
  var text = toHalfWidth_(perkText || '');
  var result = { count: null, variety: null, note: '' };
  var m;

  // 「ランダム3種から1枚」「ランダム3種1枚」など
  m = text.match(/ランダム\s*(\d+)\s*種(?:から)?\s*(\d+)?\s*枚?/);
  if (m) {
    result.variety = parseInt(m[1], 10);
    result.count = m[2] ? parseInt(m[2], 10) : 1;
    result.note = 'ランダム' + m[1] + '種から' + result.count + '枚';
    return result;
  }
  // 「各1枚」「全員1枚」「お一人様1枚」
  m = text.match(/(?:各|全員|お一人様|ひとり)\s*(\d+)\s*枚/);
  if (m) {
    result.count = parseInt(m[1], 10);
    result.note = m[0];
    return result;
  }
  // 「2枚」
  m = text.match(/(\d+)\s*枚/);
  if (m) {
    result.count = parseInt(m[1], 10);
    result.note = result.count + '枚';
    return result;
  }
  // 「3種類」「全3種」
  m = text.match(/(?:全)?\s*(\d+)\s*種(?:類)?/);
  if (m) {
    result.variety = parseInt(m[1], 10);
    result.note = m[1] + '種';
    return result;
  }
  return result;
}

/**
 * 時間表記の統一
 *   「開場10:00」「開場 10時」「開場１０：００」→「開場 10:00"
 *   「開演11:00」→「開演 11:00」／「出演13:30〜」→「出演 13:30〜"
 */
function normalizeTimeText(time) {
  var t = toHalfWidth_(time);
  if (!t) return '';
  // 「開場10時」「開場 10時30分」→「開場 10:00」「開場 10:30」
  t = t.replace(/(開場|開演|出演|開園|受付)\s*(\d{1,2})時(\d{1,2})?分?/g, function (m, label, h, min) {
    return label + ' ' + pad2_(h) + ':' + (min ? pad2_(min) : '00');
  });
  // 「開場10:00」「開場 10:00」→「開場 10:00」
  t = t.replace(/(開場|開演|出演|開園|受付)\s*(\d{1,2}):(\d{2})/g, function (m, label, h, min) {
    return label + ' ' + pad2_(h) + ':' + min;
  });
  return t.replace(/\s+/g, ' ').trim();
}

/** イベント名の軽い正規化（全角半角統一・連続スペース整理） */
function normalizeEventName(name) {
  var s = toHalfWidth_(name);
  try { s = s.normalize('NFKC'); } catch (e) { /* 同上 */ }
  return s.replace(/\s+/g, ' ').trim();
}

// ------------------------------------------------------------
// レコード全体の正規化（Grok抽出結果・手動入力の共通入口）
// ------------------------------------------------------------

/**
 * 1件の出演情報レコードを正規化して返す。
 * 入力: { eventName, performer, stage, time, perk, perkDetail, xUrl,
 *        source, confidence, status, extractedAt, note, ... }
 */
function normalizeRecord(rec) {
  rec = rec || {};
  var perkText = [rec.perk || '', rec.perkDetail || rec.perkNote || ''].join(' ');
  var countInfo = extractPerkCount(perkText);
  var conf = parseFloat(rec.confidence);

  var out = {
    eventName:   normalizeEventName(rec.eventName),
    performer:   String(rec.performer || '').replace(/\s+/g, ' ').trim(),
    stage:       String(rec.stage || '').replace(/\s+/g, ' ').trim(),
    time:        normalizeTimeText(rec.time),
    perk:        String(rec.perk || '').replace(/\s+/g, ' ').trim(),
    perkType:    normalizePerkType(perkText),
    perkDetail:  String(rec.perkDetail || rec.perkNote || countInfo.note || '').replace(/\s+/g, ' ').trim(),
    perkCount:   countInfo.count,
    xUrl:        String(rec.xUrl || '').trim(),
    source:      rec.source || 'manual',
    confidence:  isNaN(conf) ? null : conf,
    extractedAt: rec.extractedAt || '',
    note:        String(rec.note || '').trim(),
    eventDate:   normalizeEventDate_(rec.eventDate),
    isArchived:  String(rec.isArchived || '').trim()
  };

  // 信頼度がしきい値未満のものは「要確認」としてマーク（人間のチェック待ち）
  if (out.confidence !== null && out.confidence < CONFIG.CONFIDENCE_THRESHOLD) {
    out.status = 'pending';
  } else {
    out.status = rec.status || 'confirmed';
  }
  return out;
}
