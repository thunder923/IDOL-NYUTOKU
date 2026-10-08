/**
 * Code.gs — my-circuit-app 用 GAS のエントリーポイント
 *
 * 【エンドポイント】
 *   GET : 既存の Vue アプリ向けにシート全行を配信（ヘッダー名キーのオブジェクト配列）
 *
 * 【補助関数（GASエディタから手動実行）】
 *   setupSheets()       : シートとヘッダー列を自動作成（初回のみ実行）
 *   archivePastEvents() : 開催日が過ぎたイベントを自動アーカイブ（毎日トリガー推奨）
 *   syncFormResponses() : フォーム回答をシート1へ転記（正規化・id解決・重複チェック付き）
 *   testNormalizer()    : 正規化ロジックの動作確認（Test.gs）
 *
 * 【データの入り口】
 *   - 情報提供フォーム → syncFormResponses()（フォーム送信時トリガー onFormSubmit 推奨）
 *   - シート1 への直接入力（手動）
 *   アプリへの表示は doGet（GET）経由。終了イベントは archivePastEvents() で自動非表示。
 */

// ------------------------------------------------------------
// Webアプリ エントリーポイント
// ------------------------------------------------------------

/** GET: Vue アプリ向けデータ配信（既存アプリとの互換フォーマット: 素の配列） */
function doGet(e) {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return jsonResponse_([]);
  }
  var headers = values[0].map(canonicalHeader_);
  // eventName 列が特定できない場合は列位置で補完（A=id, B=eventName, C=performer, D=stage, E=perks）
  if (headers.indexOf('eventName') === -1) {
    var positional = ['id', 'eventName', 'performer', 'stage', 'perks'];
    for (var p = 0; p < positional.length && p < headers.length; p++) {
      if (!headers[p]) headers[p] = positional[p];
    }
  }
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    headers.forEach(function (h, j) {
      if (h) obj[h] = values[i][j];
    });
    if (obj.eventName) rows.push(obj);
  }
  return jsonResponse_(rows);
}

// ------------------------------------------------------------
// アーカイブ（終了イベントの非表示）
// ------------------------------------------------------------

/**
 * 開催日（eventDate）が今日より前の行を自動でアーカイブする。
 * isArchived 列に CONFIG.ARCHIVE_FLAG（'archived'）を書き込む。
 * 手動実行でも、時間主導トリガー（毎日実行）でも使える。
 * 復活させたい場合は isArchived セルを空にするだけ。
 * 戻り値: アーカイブした行数
 */
function archivePastEvents() {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return 0;
  var headers = values[0].map(canonicalHeader_);
  var idxDate = headers.indexOf('eventDate');
  var idxFlag = headers.indexOf('isArchived');
  if (idxDate === -1 || idxFlag === -1) {
    // 列が無い場合は先に作成して再読込
    ensureHeaderRow_(sheet, CONFIG.COLUMNS);
    values = sheet.getDataRange().getValues();
    headers = values[0].map(canonicalHeader_);
    idxDate = headers.indexOf('eventDate');
    idxFlag = headers.indexOf('isArchived');
  }
  if (idxDate === -1 || idxFlag === -1) {
    throw new Error('eventDate / isArchived 列を特定できませんでした');
  }

  var today = toDate_(new Date()); // 本日 00:00
  var count = 0;
  for (var i = 1; i < values.length; i++) {
    var flag = String(values[i][idxFlag] || '').trim();
    if (flag) continue; // 既にアーカイブ済み or 手動で非表示指定済み
    var d = toDate_(values[i][idxDate]);
    if (d && d < today) {
      sheet.getRange(i + 1, idxFlag + 1).setValue(CONFIG.ARCHIVE_FLAG);
      count++;
    }
  }
  Logger.log('archivePastEvents: ' + count + ' 行をアーカイブしました');
  return count;
}

// ------------------------------------------------------------
// フォーム回答 → シート1 への転記
// ------------------------------------------------------------

/**
 * Google フォームの回答（フォームの回答 1）を シート1 へ転記する。
 * 正規化（PerkNormalizer）・イベントid解決（イベントマスター）・重複チェック付き。
 * 手動実行でも、フォーム送信時トリガー（onFormSubmit）でも使える。
 * 転記済みの行はフォーム回答シートの末尾列 `processed` に印を付けて再処理しない。
 * 戻り値: 新規転記した行数
 */
function syncFormResponses() {
  var ss = getSpreadsheet_();
  var formSheet = ss.getSheetByName(CONFIG.FORM_SHEET_NAME);
  if (!formSheet) {
    Logger.log('フォーム回答シートがありません: ' + CONFIG.FORM_SHEET_NAME);
    return 0;
  }
  var sheet = getSheet_();
  ensureHeaderRow_(sheet, CONFIG.COLUMNS);

  var values = formSheet.getDataRange().getValues();
  if (values.length <= 1) return 0;
  var headers = values[0].map(canonicalHeader_);
  var idxDone = headers.indexOf('processed');
  if (idxDone === -1) {
    // 転記管理列を追加（フォーム回答シートの末尾に自由列として追加できる）
    formSheet.getRange(1, headers.length + 1).setValue('processed');
    idxDone = headers.length;
    headers.push('processed');
  }

  var count = 0;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idxDone] || '').trim()) continue; // 処理済み
    var raw = {};
    headers.forEach(function (h, j) {
      if (h) raw[h] = values[i][j];
    });
    if (!raw.eventName) continue;

    var rec = normalizeRecord({
      eventName: raw.eventName,
      performer: raw.performer,
      stage:     raw.stage,
      time:      raw.time,
      eventDate: raw.eventDate,
      perk:      raw.perks,
      xUrl:      raw.xUrl,
      source:    'manual'
    });
    rec.id = resolveEventId_(ss, rec.eventName);

    if (isDuplicate_(sheet, rec)) {
      formSheet.getRange(i + 1, idxDone + 1).setValue('duplicate');
      continue;
    }
    appendRow_(sheet, rec);
    formSheet.getRange(i + 1, idxDone + 1).setValue('done');
    count++;
  }
  Logger.log('syncFormResponses: ' + count + ' 件転記しました');
  return count;
}

/** フォーム送信時トリガー用（トリガー設定: イベント=フォーム送信時 / 関数=onFormSubmit） */
function onFormSubmit(e) {
  syncFormResponses();
}

// ------------------------------------------------------------
// セットアップ
// ------------------------------------------------------------

/** シートとヘッダー列を自動作成する（初回セットアップ時に1回実行） */
function setupSheets() {
  var ss = getSpreadsheet_();

  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SHEET_NAME);
  ensureHeaderRow_(sheet, CONFIG.COLUMNS);

  Logger.log('セットアップ完了: ' + CONFIG.SHEET_NAME);
}

// ------------------------------------------------------------
// 内部ユーティリティ
// ------------------------------------------------------------

function getSpreadsheet_() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return sheetId
    ? SpreadsheetApp.openById(sheetId)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function getSheet_() {
  var sheet = getSpreadsheet_().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error('シートが見つかりません: ' + CONFIG.SHEET_NAME + '（先に setupSheets() を実行してください）');
  }
  return sheet;
}

/**
 * ヘッダー名を canonical 名に変換（別名・大文字小文字・日本語ヘッダーを吸収）
 * フォームの質問文が長い列名（例: 「イベント名(無ければその他に)」「入場特典 (なしと不明も…)」）
 * にも対応するため、完全一致しない場合は前方一致（最長一致）で吸収する。
 */
function canonicalHeader_(header) {
  var raw = String(header || '').trim();
  if (!raw) return '';
  var h = raw.toLowerCase();
  var aliases = CONFIG.HEADER_ALIASES;

  // 1. 完全一致（canonical 名・別名のいずれか）
  for (var canonical in aliases) {
    if (canonical.toLowerCase() === h) return canonical;
    var list = aliases[canonical];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i]).toLowerCase() === h) return canonical;
    }
  }

  // 2. 前方一致（最長の別名を優勝。短すぎる別名（1文字）は誤爆防止のため除外）
  //    さらに、別名の直後が英数字の場合は不一致とする
  //    （例: 'perkType' は 'perks' の前方一致とはみなさない）
  var best = '';
  for (var canonical2 in aliases) {
    var list2 = [canonical2].concat(aliases[canonical2]);
    for (var j = 0; j < list2.length; j++) {
      var a = String(list2[j]).toLowerCase();
      if (a.length >= 2 && h.indexOf(a) === 0 && a.length > best.length) {
        var next = h.charAt(a.length);
        if (!/[a-z0-9]/.test(next)) {
          best = canonical2;
        }
      }
    }
  }
  if (best) return best;

  return raw; // 未知のヘッダーはそのまま返す
}

/**
 * イベントマスターから eventName に一致する id を探す。
 * 見つからなければ新規 id を採番してマスターへ追記する。
 * マスターシートが無い場合は '' を返す（App.vue は eventName でグルーピングにフォールバック）。
 */
function resolveEventId_(ss, eventName) {
  if (!eventName) return '';
  var master = ss.getSheetByName(CONFIG.EVENT_MASTER_SHEET);
  if (!master) return '';
  var values = master.getDataRange().getValues();
  if (values.length <= 1) return '';
  var headers = values[0].map(canonicalHeader_);
  var idxId = headers.indexOf('id');
  var idxName = headers.indexOf('eventName');
  if (idxId === -1 || idxName === -1) return '';

  var key = normalizeKey_(eventName);
  var maxId = 0;
  for (var i = 1; i < values.length; i++) {
    var rowId = parseInt(values[i][idxId], 10);
    if (!isNaN(rowId) && rowId > maxId) maxId = rowId;
    if (normalizeKey_(values[i][idxName]) === key) {
      return values[i][idxId]; // 既存イベントの id を再利用
    }
  }
  // 新規イベント: 翌番号を採番してマスターへ追記
  var newId = maxId + 1;
  appendMasterRow_(master, newId, eventName);
  return newId;
}

/** イベントマスターへ [id, eventName] の行を追記（ヘッダー名に基づいて列マッピング） */
function appendMasterRow_(master, id, eventName) {
  var lastCol = master.getLastColumn();
  var headers = lastCol > 0
    ? master.getRange(1, 1, 1, lastCol).getValues()[0].map(canonicalHeader_)
    : ['id', 'eventName'];
  var row = headers.map(function (h) {
    if (h === 'id') return id;
    if (h === 'eventName') return eventName;
    return '';
  });
  master.appendRow(row);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** ヘッダー行に不足している列を末尾へ追加する */
function ensureHeaderRow_(sheet, columns) {
  var lastCol = sheet.getLastColumn();
  var existing = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  columns.forEach(function (c) {
    if (existing.indexOf(c) === -1) {
      sheet.getRange(1, existing.length + 1).setValue(c);
      existing.push(c);
    }
  });
}

/** 正規化キー（イベント名＋グループ名＋特典名）で重複判定 */
function isDuplicate_(sheet, rec) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return false;
  var headers = values[0].map(canonicalHeader_);
  var idx = {};
  headers.forEach(function (h, i) {
    if (h && idx[h] === undefined) idx[h] = i;
  });
  // 特典列は実シートの列名（perks）を優先し、無ければ perk を使う
  var iPerk = idx[CONFIG.PERK_COLUMN] !== undefined ? idx[CONFIG.PERK_COLUMN] : idx.perk;
  if (idx.eventName === undefined || idx.performer === undefined || iPerk === undefined) {
    return false; // 必須列が無い場合は重複判定しない
  }

  var keyEvent     = normalizeKey_(rec.eventName);
  var keyPerformer = normalizeKey_(rec.performer);
  var keyPerk      = normalizeKey_(rec.perk);
  if (!keyEvent || !keyPerformer || !keyPerk) return false;

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (normalizeKey_(row[idx.eventName]) === keyEvent &&
        normalizeKey_(row[idx.performer]) === keyPerformer &&
        normalizeKey_(row[iPerk]) === keyPerk) {
      return true;
    }
  }
  return false;
}

/** 正規化済みレコードをヘッダー列順に並べて1行追記 */
function appendRow_(sheet, rec) {
  var lastCol = sheet.getLastColumn();
  var headers = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(canonicalHeader_)
    : CONFIG.COLUMNS;
  var row = headers.map(function (h) {
    var v = h ? rec[h] : undefined;
    // 正規化レコードの perk は既存の perks 列へ書き込む（列の二重化を防ぐ）
    if ((v === undefined || v === null || v === '') && h === CONFIG.PERK_COLUMN) {
      v = rec.perk;
    }
    if (v === undefined || v === null) return '';
    if (v instanceof Date) {
      return Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    }
    return v;
  });
  sheet.appendRow(row);
}
