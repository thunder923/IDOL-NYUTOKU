/**
 * Config.gs — my-circuit-app 用 GAS の設定
 *
 * 【スクリプトプロパティの設定】
 *   GASエディタ > プロジェクトの設定 > スクリプト プロパティ に以下を追加してください。
 *   - SHEET_ID : 対象スプレッドシートのID（URL の /d/ の後ろの文字列。
 *                コンテナバインド型スクリプトの場合は未設定でも可）
 *
 * 【実スプレッドシート構成（2026-10-09 時点）】
 *   - シート1        : メインデータ（id / eventName / performer / stage(会場) / perks ...）
 *   - イベントマスター: イベントのマスター（id / eventName）
 *                     ※ id は「イベント単位」で採番され、シート1 の同一イベント行は同じ id を共有する
 *   - 出演者のコピー  : perks の入力規則リスト
 *   - フォームの回答 1 : Google フォーム回答（開催日/イベント名/出演者/出演時間/ステージ/入場特典/告知URL）
 */
var CONFIG = {
  // --- スプレッドシート ---
  SHEET_NAME: 'シート1',                 // メインデータシート名（実シート名に合わせて変更）
  EVENT_MASTER_SHEET: 'イベントマスター', // イベントマスター（id と eventName の対応表）
  FORM_SHEET_NAME: 'フォームの回答 1',   // Google フォームの回答シート

  // 既存シートの入場特典列の列名（App.vue は perk / perks の両方に対応済み）
  PERK_COLUMN: 'perks',

  // アーカイブ（終了イベントの非表示）設定
  ARCHIVE_FLAG: 'archived', // isArchived 列に書き込む値（この値があれば非表示）

  // メインシートの列名（1行目ヘッダー。setupSheets() で不足分を自動追加）
  // 既存列: id / eventName / performer / stage / perks（/ time / xUrl）
  // 追加列: perkType / perkDetail / perkCount / source / note
  // アーカイブ列: eventDate（開催日） / isArchived（アーカイブフラグ）
  COLUMNS: [
    'id',
    'eventName',
    'performer',
    'stage',
    'perks',
    'time',
    'xUrl',
    'perkType',
    'perkDetail',
    'perkCount',
    'source',
    'note',
    'eventDate',
    'isArchived'
  ],

  // ヘッダー名の別名辞書（表記揺れ・日本語ヘッダーを吸収して canonical 名に変換）
  HEADER_ALIASES: {
    id:        ['id', 'イベントid', 'イベントID'],
    eventName: ['eventName', 'event', 'イベント名', 'イベント', 'ライブ名'],
    performer: ['performer', 'performers', '出演者', 'グループ', 'グループ名', 'アーティスト', 'ユニット'],
    stage:     ['stage', 'stages', '会場', 'ステージ', 'venue', 'ホール'],
    perks:     ['perks', 'perk', '入場特典', 'にゅうとく', '入特', '特典'],
    time:      ['time', '時間', '開場', '開演', '出演時間'],
    xUrl:      ['xUrl', 'xurl', 'url', 'link', 'リンク', '告知URL', 'X'],
    eventDate: ['eventDate', '開催日', '日付', 'date', '開催年月日'],
    isArchived: ['isArchived', 'archived', 'archive', 'アーカイブ', '非表示', 'hidden'],
    processed: ['processed', '処理済み', '転記済み', 'done'], // フォーム回答の転記管理用
    // 正規化・管理系の列（完全一致で保護し、前方一致の誤爆を防ぐ）
    perkType:    ['perkType', '特典種別', '種別', 'タイプ'],
    perkDetail:  ['perkDetail', '特典詳細', '詳細'],
    perkCount:   ['perkCount', '枚数'],
    source:      ['source', '取得元', 'ソース'],
    note:        ['note', '備考', 'メモ']
  }
};
