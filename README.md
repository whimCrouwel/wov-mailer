# wov-mailer

Airtable の連絡先リストから、Resend 経由でメール一斉送信を行う macOS デスクトップアプリです。

---

## 機能

- **Airtable 連携** — ベース・テーブルを選択し、フィルターで送信対象を絞り込む
- **差し込み変数** — `{{fieldName}}` 形式でAirtableのフィールド値をメール本文に埋め込める。エディタ内で `@` を入力するとフィールド候補が表示される
- **メールテンプレート** — 5種類のHTMLテンプレートを内蔵。Gmail / Outlook / Apple Mail など主要クライアントで表示確認済み
- **プレビュー** — 送信前にAirtableの1行目のデータで差し込み結果をプレビューできる
- **送信先リスト確認** — 送信前に名前とメールアドレスの一覧をダイアログで確認できる
- **送信履歴** — 過去のブロードキャスト履歴を管理。当時の送信先スナップショットを保存するため、Airtable のデータが変わっても受信者リストを確認できる
- **内蔵ターミナル** — Claude Code MCP と連携したターミナルをアプリ内に内蔵

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
初回のみ以下のコマンドで登録してください。

```bash
claude mcp add wov-mailer --transport http http://127.0.0.1:3741 --scope user
```

以降はアプリを起動するだけで自動接続されます。

---

## ライセンス

MIT

---

## 作者

[Whim on Vim](https://whim-on-vim.com)
