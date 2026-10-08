/**
 * GrokService.gs — xAI Grok API を使った告知抽出サービス
 *
 * X（旧Twitter）の告知ポスト本文テキスト＋フライヤー画像URLを Grok の
 * マルチモーダル機能に渡し、「イベント名 / グループ名 / ステージ / 時間 /
 * 入場特典」を JSON で抽出する。抽出結果は PerkNormalizer で正規化する。
 *
 * 【事前準備】
 *   1. https://x.ai/api で APIキーを発行
 *   2. GAS のスクリプトプロパティに「XAI_API_KEY」として保存
 *   3. （任意）スクリプトプロパティ「SHEET_ID」を設定
 */

/**
 * 抽出用システムプロンプト（JSONスキーマ厳守・表記揺れの吸収ルールを明示）
 */
var GROK_SYSTEM_PROMPT = [
  'あなたはアイドルの対バンライブ・サーキットフェスの告知を解析するアシスタントです。',
  'ユーザーが渡す X（旧Twitter）のポスト本文テキストと、添付画像（フライヤー・告知画像）のURLから、',
  'イベント情報とグループごとの出演情報・入場特典を抽出し、指定のJSONスキーマでのみ回答してください。',
  '',
  '【出力スキーマ（この形式以外の文章・説明・コードブロックは一切出力しない）】',
  '{',
  '  "events": [',
  '    {',
  '      "eventName":  "イベント名（例: 〇〇アイドルフェス2026 Day1）",',
  '      "performer":  "グループ名・ユニット名（個人名でも可）",',
  '      "stage":      "出演ステージ名（例: メインステージ / Aステージ / 特典会ステージ）",',
  '      "time":       "開場・開演・出演時間（例: 開場 10:00 / 開演 11:00 / 出演 13:30〜）",',
  '      "eventDate":  "開催日（YYYY-MM-DD 形式。例: 2026-10-09）",',
  '      "perk":       "入場特典の正式名称（後述の表記揺れを吸収して記載）",',
  '      "perkDetail": "特典の詳細（枚数・種類数・条件。例: 全員1枚 / ランダム3種から1枚 / 先着100名）",',
  '      "confidence": 0.0〜1.0の数値（このグループ情報の抽出確信度）',
  '    }',
  '  ]',
  '}',
  '',
  '【抽出ルール】',
  '1. 1つのポスト/画像に複数グループが登場する場合、グループごとに events 配列の要素を分けてください。',
  '2. 入場特典の表記揺れは正式名称に吸収して perk に記載してください:',
  '   - 「にゅうとく」「入特」「入場プレゼント」→ 入場特典',
  '   - 「指名」「指名チケット」→ 指名特典',
  '   - 「目当て」「お目当て」「目当て特典」→ 目当て特典',
  '   - 「生写」「ブロマ」→ 生写真（ブロマイド）',
  '   - 「ポスカ」→ ポストカード',
  '   - 「ステッカー」→ シール・ステッカー',
  '3. 枚数・種類数・条件（先着/抽選/開場から など）は perkDetail にまとめてください。',
  '4. テキストと画像で内容が矛盾する場合は、画像（フライヤー）の記載を優先してください。',
  '5. 読み取れない・存在しない項目は null にしてください（空文字や憶測・補完は禁止）。',
  '6. グループ名・イベント名は、実際に書かれている表記をそのまま使ってください（勝手に省略・補完しない）。',
  '7. 日付や時間の数字は、画像・本文に実際に書かれているものだけを使ってください。',
  '8. 開催日が読み取れる場合は eventDate に YYYY-MM-DD 形式で記載してください（例: 2026-10-09）。読み取れない場合は null。',
  '9. 出力は素のJSONのみ。説明文・挨拶・コードブロック（```）は一切不要です。',
  '',
  '【確信度（confidence）の目安】',
  '- 0.9〜1.0: テキスト・画像ともにはっきり記載されている',
  '- 0.6〜0.8: 片方にしか記載がない、または略記を判読した',
  '- 0.3〜0.5: かすれ・小さく判読が難しい',
  '- 0.0〜0.2: ほぼ読み取れない（該当項目は null にすることも検討）'
].join('\n');

/** ユーザーメッセージ（テキスト＋画像URL一覧）を組み立てる */
function buildUserText_(input) {
  var lines = [];
  lines.push('【ポスト本文テキスト】');
  lines.push(input.text ? String(input.text) : '(テキストなし。画像のみで判断してください)');
  lines.push('');
  lines.push('【参考: ポストURL】');
  lines.push(input.postUrl ? String(input.postUrl) : '(なし)');
  lines.push('');
  lines.push('【添付画像URL一覧】');
  if (input.imageUrls && input.imageUrls.length) {
    input.imageUrls.forEach(function (u, i) {
      lines.push((i + 1) + '. ' + u);
    });
    lines.push('※ 画像はこの後に続けて送信します。テキストと矛盾する場合は画像を優先してください。');
  } else {
    lines.push('(画像なし)');
  }
  return lines.join('\n');
}

/**
 * Grok API を呼び出し、パース済みの JSON（{ events: [...] }）を返す。
 * input: { postUrl: string, text: string, imageUrls: string[] }
 */
function callGrok_(input) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('XAI_API_KEY');
  if (!apiKey) {
    throw new Error('スクリプトプロパティ「XAI_API_KEY」が未設定です。https://x.ai/api で発行したキーを設定してください。');
  }

  // ユーザーメッセージはマルチモーダル（テキスト＋画像URL）
  var parts = [{ type: 'text', text: buildUserText_(input) }];
  (input.imageUrls || []).forEach(function (url) {
    if (url) {
      parts.push({ type: 'image_url', image_url: { url: String(url) } });
    }
  });

  var payload = {
    model: CONFIG.XAI_MODEL,
    temperature: CONFIG.XAI_TEMPERATURE,
    max_tokens: CONFIG.XAI_MAX_TOKENS,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: GROK_SYSTEM_PROMPT },
      { role: 'user', content: parts }
    ]
  };

  var res = UrlFetchApp.fetch(CONFIG.XAI_API_ENDPOINT, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = res.getResponseCode();
  var body = res.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Grok API エラー: HTTP ' + code + ' / ' + body.substring(0, 500));
  }

  var outer = JSON.parse(body);
  var content = (outer && outer.choices && outer.choices[0] && outer.choices[0].message)
    ? outer.choices[0].message.content
    : '';
  return parseGrokJson_(content);
}

/** モデル出力からJSON部分を堅牢に取り出す（コードブロック混入対策） */
function parseGrokJson_(content) {
  var text = String(content || '').trim();
  var fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  var start = text.indexOf('{');
  var end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Grokの出力からJSONを抽出できませんでした: ' + text.substring(0, 200));
  }
  return JSON.parse(text.substring(start, end + 1));
}

/**
 * Xポスト＋画像から出演情報を抽出し、正規化したレコード配列を返す。
 * input: { postUrl: string, text: string, imageUrls: string[] }
 * 戻り値: normalizeRecord 済みの配列
 */
function extractFromX(input) {
  var parsed = callGrok_(input);
  var events = parsed.events || parsed.data || [];
  if (!Array.isArray(events)) events = [events];

  return events.map(function (ev) {
    ev = ev || {};
    return normalizeRecord({
      eventName:  ev.eventName,
      performer:  ev.performer,
      stage:      ev.stage,
      time:       ev.time,
      eventDate:  ev.eventDate,
      perk:       ev.perk,
      perkDetail: ev.perkDetail || ev.perkNote || ev.detail,
      xUrl:       ev.xUrl || input.postUrl || '',
      confidence: ev.confidence,
      source:     'x-auto'
    });
  });
}
