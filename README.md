# 🎪 my-circuit-app

サーキットフェスや対バンイベントにおける、**出演者ごとの「出演ステージ」と「入場特典」をカード形式でわかりやすく確認・管理できるWebアプリケーション**です。

Google スプレッドシートを簡易データベースとして利用しており、手軽に情報更新ができるほか、Google フォームからの情報提供にも対応しています。

---

## ✨ 主な機能

- **イベント別の自動グループ化**: スプレッドシートのデータをイベントごとにまとめてカード表示
- **アコーディオン表示**: アイドル・グループ名をクリックすると「出演ステージ」と「入場特典」が開閉
- **🤖 Grok自動取得（NEW）**: X（旧Twitter）の告知ポスト＋フライヤー画像を xAI Grok が解析し、入場特典情報を自動でスプレッドシートへ登録
- **🧹 表記揺れの自動吸収（NEW）**: 「にゅうとく」「入特」「指名」「目当て」「生写」「ポスカ」などの表記揺れを種別分類・枚数・時間表記に正規化
- **特典種別バッジ表示（NEW）**: 指名特典/目当て特典/チェキ/生写真などを色付きバッジでひと目で判別
- **取得元・信頼度の可視化（NEW）**: 「Grok自動取得」「要確認（信頼度）」バッジと抽出日時を表示
- **終了イベントのアーカイブ（NEW）**: 開催日ベースで終了イベントを非表示化。手動フラグ・GAS自動アーカイブ（毎日トリガー可）に対応し、「過去のイベントも表示」トグルで復活も可能
- **フォーム回答の自動転記（NEW）**: 情報提供フォームの回答を正規化・id解決・重複チェック付きでシートへ自動転記（フォーム送信時トリガー対応）
- **Google フォーム連携**: ユーザーや関係者からの情報提供フォームへ直接アクセス可能
- **スプレッドシートリアルタイム同期**: GAS（Google Apps Script）を介して最新情報を自動反映

---

## 🛠 技術スタック

- **フロントエンド**: Vue.js (v2/v3), Vuetify (UIコンポーネント)
- **ビルドツール**: Vite
- **バックエンド / DB**: Google Apps Script (GAS), Google Sheets
- **AI連携**: xAI Grok API（マルチモーダル: テキスト＋画像からのJSON抽出）
- **ホスティング**: Vercel

---

## 🔄 データフロー（Grok自動取得）

```text
Xの告知ポスト / フライヤー画像
        │  postUrl + 本文テキスト + 画像URL
        ▼
GAS: doPost (action=extract) ──▶ Grok API（grok-2-vision）
        │                                │ テキスト＋画像を解析
        │◀────── JSON 抽出結果 ─────────┘
        ▼
PerkNormalizer（表記揺れ吸収・正規化・重複チェック）
        ▼
Google スプレッドシートへ appendRow（source=x-auto, confidence 付き）
        ▼
Vue.js アプリ（GASからGET）── カード表示（種別バッジ / 要確認バッジ）
```

バッチ運用として「取得キュー」シートにURLを登録しておくと、
時間トリガー（`processQueue`）が5分おきに自動で抽出・登録します。

---

## 📂 ディレクトリ構成

```text
my-circuit-app/
├── public/              # 静的ファイル
├── src/
│   ├── asset/           # サンプルデータ
│   ├── components/
│   │   └── EventCard.vue # グループ別アコーディオン＋特典種別バッジ表示
│   ├── utils/
│   │   └── perk.js       # 入場特典の種別定義・正規化（表示用）
│   ├── App.vue          # メインコンポーネント（GASデータ取得・データ加工）
│   └── main.js          # アプリケーションのエントリーポイント
├── gas/                 # ★ GAS（Google Apps Script）側コード
│   ├── Config.gs        #   設定（Grokモデル・シート列名・信頼度しきい値）
│   ├── PerkNormalizer.gs #  表記揺れ吸収・正規化
│   ├── GrokService.gs   #  xAI Grok API 呼び出し＋抽出プロンプト
│   ├── Code.gs          #  doGet / doPost / processQueue / setupSheets
│   ├── Test.gs          #  正規化ロジックの動作確認
│   └── README.md        #  ★ GASセットアップ手順（APIキー設定・デプロイ方法）
├── index.html
├── package.json
└── vite.config.js
```

---

## 📋 スプレッドシート列構成

| 列名 | 説明 | 入力元 |
|---|---|---|
| `id` | 行ID（自動採番） | 自動 |
| `eventName` | イベント名 | 手動 / Grok |
| `performer` | グループ名・出演者 | 手動 / Grok |
| `stage` | 出演ステージ | 手動 / Grok |
| `time` | 開場/開演/出演時間（例: 開場 10:00） | 手動 / Grok（正規化） |
| `perk` | 入場特典名 | 手動 / Grok |
| `perkType` | 特典種別（指名特典/目当て特典/チェキ/生写真/ポストカード/シール/整理券/入場特典/その他） | 自動正規化 |
| `perkDetail` | 特典詳細（例: 全員1枚 / ランダム3種から1枚） | 手動 / Grok |
| `perkCount` | 枚数（数値） | 自動抽出 |
| `xUrl` | 告知ポストURL | 手動 / Grok |
| `source` | 取得元（`manual` / `x-auto`） | 自動 |
| `status` | 確定状況（`confirmed` / `pending`=要確認） | 自動 |
| `confidence` | Grok抽出の信頼度（0.0〜1.0） | Grok |
| `extractedAt` | 抽出日時 | 自動 |
| `note` | 備考 | 手動 |
| `eventDate` | 開催日（YYYY-MM-DD に正規化） | 手動 / Grok |
| `isArchived` | アーカイブフラグ（`archived` で非表示） | 手動 / `archivePastEvents()` |

> 不足している列は、GASエディタで `setupSheets()` を実行すると自動追加されます。
> `id` はイベント単位で共有（イベントマスター参照）。終了イベントは削除せず `isArchived` でアーカイブする運用を推奨（詳細は [gas/README.md](gas/README.md)）。

---

## 🚀 GAS（Grok連携）のセットアップ

詳細は **[gas/README.md](gas/README.md)** を参照してください。概要:

1. <https://x.ai/api> でAPIキーを発行し、GASのスクリプトプロパティ `XAI_API_KEY` に設定
2. `gas/` 内のファイルをGASエディタにコピー
3. `setupSheets()` を実行（シート・列の自動作成）
4. `testNormalizer()` で正規化ロジックを動作確認（APIキー不要）
5. Webアプリとしてデプロイ（アクセス: 全員）
6. POST（`action=extract`）または「取得キュー」シート＋トリガーで運用

