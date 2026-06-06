# wov-mailer

Airtable の連絡先リストから、Resend 経由でメール一斉送信を行う macOS デスクトップアプリです。

---

## 機能

- **Airtable 連携** — ベース・テーブルを選択し、フィルターで送信対象を絞り込む
- **差し込み変数** — `{{fieldName}}` 形式でAirtableのフィールド値をメール本文に埋め込める。エディタ内で `@` を入力するとフィールド候補が表示される
- **メールテンプレート** — 5種類のHTMLテンプレートを内蔵。Gmail / Outlook / Apple Mail など主要クライアントで表示確認済み
- **マーケティング / トランザクション切替** — ブロードキャストごとに送信タイプを切り替えられる。マーケティングON: 配信停止リンクを含み、Resend の配信停止フィルターを適用。マーケティングOFF: リンクなしのトランザクション送信（通知・領収書など）
- **プレビュー** — 送信前にAirtableの1行目のデータで差し込み結果をプレビューできる
- **送信先リスト確認** — 送信前に名前とメールアドレスの一覧をダイアログで確認できる
- **送信履歴** — 過去のブロードキャスト履歴を管理。当時の送信先スナップショットを保存するため、Airtable のデータが変わっても受信者リストを確認できる
- **下書き保存** — 作成中のブロードキャストを下書きとして保存・再編集・削除できる。MCP からも操作可能
- **内蔵ターミナル** — Claude Code MCP と連携したターミナルをアプリ内に内蔵。パネルを閉じても pty セッションは維持される

---

## 必要環境

- macOS (arm64 / x64)
- [Node.js](https://nodejs.org/) v18 以上
- [Airtable](https://airtable.com/) アカウントと Personal Access Token
- [Resend](https://resend.com/) アカウントと API キー（送信ドメインの認証が必要）

---

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/YOUR_USERNAME/wov-mailer.git
cd wov-mailer
```

### 2. 依存パッケージのインストール

```bash
npm install
```

`postinstall` スクリプトにより、`node-pty` が Electron 用に自動リビルドされます。

### 3. 開発サーバーの起動

```bash
npm run dev
```

### 4. 初回設定

アプリ起動後、**Settings** 画面で以下を設定してください。

| 項目 | 説明 |
|------|------|
| Airtable Token | Airtable の Personal Access Token |
| Resend API Key | Resend の API キー |
| Sender Name | 送信者名（例: Whim on Vim） |
| Sender Email | 送信元メールアドレス（Resend で認証済みのドメイン） |

設定は `~/.config/wov-mailer/config.json` に保存されます（リポジトリには含まれません）。

---

## ビルド（macOS アプリとして配布）

```bash
npm run dist
```

`dist/` フォルダに `wov-mailer-0.1.0-arm64.dmg` が生成されます。

---

## テンプレート

`templates/` フォルダにHTMLテンプレートを追加することで、カスタムテンプレートを利用できます。  
初回起動時に `~/.config/wov-mailer/templates/` へコピーされます。

| テンプレート名 | 説明 |
|--------------|------|
| `minimal` | シンプルな白カード（デフォルト） |
| `newsletter` | ダークテーマ、パープルアクセント |
| `promo` | プロモーション向け、グラデーションヒーロー |
| `announcement` | お知らせ向け、グリーンアクセント |
| `default` | 基本テンプレート |

---

## MCP 連携（Claude Code）

内蔵ターミナルは Claude Code の MCP サーバー（ポート 3741）と連携できます。  
各ツールには説明文が付いており、Claude が文脈に応じて自動的に適切なツールを選択します。

### リソース

| リソース | 説明 |
|----------|------|
| `wov-mailer://context` | ベース・テーブル・テンプレートの全情報を1回で取得。会話開始時に読み込むことで、Claude が選択肢を把握した上でインタラクティブに質問できる |

### 複合ツール（推奨）

| ツール | 説明 |
|--------|------|
| `setup_recipients(baseId, tableId, filters?)` | ベース・テーブル・フィルターを1回のコールで設定。送信先件数とサンプルを返す |
| `setup_content(templateName, subject, body)` | テンプレート・件名・本文を1回のコールで設定。`setup_recipients` と並行実行可能 |

### 個別ツール

| ツール | 説明 |
|--------|------|
| `list_bases` | Airtable のベース一覧を取得 |
| `select_base` | ベースを選択 |
| `list_tables` | 選択中のベースのテーブル一覧を取得（メールフィールドがあるもののみ） |
| `select_table` | テーブルを選択 |
| `add_filter` | 送信対象を絞り込むフィルターを追加 |
| `clear_filters` | フィルターをすべてクリア |
| `preview_recipients` | 現在の設定での送信先件数とサンプルを確認 |
| `set_subject` | 件名を設定 |
| `set_body` | 本文（Markdown）を設定。`{{fieldName}}` で差し込み変数を使用可能 |
| `list_templates` | テンプレート一覧を取得 |
| `select_template` | テンプレートを選択 |
| `set_marketing` | マーケティングモードの ON/OFF を切り替え |
| `list_drafts` | 保存済み下書き一覧を表示 |
| `save_draft` | 現在の状態を下書きとして保存（同一下書きは上書き） |
| `load_draft` | 下書きを復元 |
| `delete_draft` | 下書きを削除 |

初回のみ以下のコマンドで登録してください。

```bash
claude mcp add wov-mailer --transport http http://127.0.0.1:3741 --scope user
```

以降はアプリを起動するだけで自動接続されます。

### wov-mailer-compose スキル

`wov-mailer-compose` Claude スキルを使うと、コンポーズ画面を対話式に素早く埋められます。

1. `wov-mailer://context` リソースを読み込み、選択肢を把握
2. ベース・テーブル・件名・本文・テンプレートをインタラクティブに質問
3. `setup_recipients` と `setup_content` を並行実行してコンポーズ画面を一括設定

使い方: 「メールを作って」「compose an email」と話しかけるだけ。

---

## ライセンス

MIT

---

## 作者

[Whim on Vim](https://whim-on-vim.com)
