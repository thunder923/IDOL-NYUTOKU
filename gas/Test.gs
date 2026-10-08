/**
 * Test.gs — ローカル動作確認用（GASエディタから実行。APIキー不要）
 *
 * 使い方: GASエディタで testNormalizer を選んで ▶ 実行 → 表示 > ログ を確認
 */
function testNormalizer() {
  Logger.log('--- normalizePerkType（表記揺れ → 種別） ---');
  [
    'にゅうとく', '入特', '入場プレゼント', '指名', '指名チケット', 'お目当て特典',
    '目当て', 'ランダム生写真', '生写', 'ブロマイド', 'ポスカ', 'ステッカー',
    '整理券', '優先入場', 'サインチェキ', '2ショット', '謎のグッズ'
  ].forEach(function (s) {
    Logger.log(s + ' => ' + normalizePerkType(s));
  });

  Logger.log('--- extractPerkCount（枚数・種類数） ---');
  [
    '指名特典1枚', '全員2枚', '各1枚', 'ランダム3種から1枚', 'ポストカード',
    '特典なし', 'シール 全5種'
  ].forEach(function (s) {
    Logger.log(s + ' => ' + JSON.stringify(extractPerkCount(s)));
  });

  Logger.log('--- normalizeTimeText（時間表記の統一） ---');
  [
    '開場10:00', '開場 10時', '開場10時30分', '開演 11:00', '出演13:30〜',
    '開場１２：００', '開場　10:00'
  ].forEach(function (s) {
    Logger.log(s + ' => ' + normalizeTimeText(s));
  });

  Logger.log('--- 実データ例（管理スプレッドシート「シート1」の perks 列より） ---');
  [
    '15分動画 1枚', 'パチュンカード 1枚', '15秒動画', '2ショットチェキ券', 'いつでもチェキ券',
    'チェキサイン券 ＆ マルコムスクラッチ 1枚', 'すーぱーえっくじ！（写メ）',
    'サインチェキ ＆ 写メ券 1枚', 'サインチェキ', 'チェキサイン券', '写メ', '写メ券',
    '入場特典あり', '指名入場特典あり（詳細未確認）', 'お目当て物販購入でポイント1pt',
    'チェキ券+1pt,指名入場特典', 'サインあり', 'サインなし'
  ].forEach(function (s) {
    Logger.log(s + ' => ' + normalizePerkType(s) + ' / ' + JSON.stringify(extractPerkCount(s)));
  });

  Logger.log('--- canonicalHeader_（実フォームの列名そのままの長いヘッダー） ---');
  [
    'タイムスタンプ', '開催日', 'イベント名(無ければその他に)', '出演者',
    '出演時間 (00:00〜00:20)で記入(数日開催なら出演日Day1のような書き方で)', 'ステージ',
    '入場特典 (なしと不明も記入かつ注意書きがあればかっこで)', '告知URL',
    'perkType', 'perkDetail', 'perkCount', 'perks', '会場', '入場特典'
  ].forEach(function (s) {
    Logger.log(s + ' => ' + canonicalHeader_(s));
  });

  Logger.log('--- normalizeEventDate_ / toDate_（開催日の正規化） ---');
  ['2026-10-09', '2026/10/9', '2026.10.9', '10月9日', '2026年10月9日'].forEach(function (s) {
    Logger.log(s + ' => ' + normalizeEventDate_(s));
  });
  // Dateオブジェクト（スプレッドシートの日付セル）も確認
  Logger.log('Dateオブジェクト => ' + normalizeEventDate_(new Date(2026, 9, 9)));
  Logger.log('空 => [' + normalizeEventDate_('') + ']');

  Logger.log('--- normalizeRecord（レコード全体の正規化） ---');
  var rec = normalizeRecord({
    eventName:  '〇〇アイドルフェス 2026  Day1',
    performer:  '  グループA  ',
    stage:      'メインステージ',
    time:       '開場10:00',
    perk:       'にゅうとく',
    perkDetail: '指名特典 全員1枚',
    xUrl:       'https://x.com/example/status/123',
    eventDate:  '2026/10/9',
    source:     'manual'
  });
  Logger.log(JSON.stringify(rec, null, 2));
}
