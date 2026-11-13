# Playwright MCP によるブラウザ動作確認

Claude Code から [Playwright MCP](https://github.com/microsoft/playwright-mcp) を使い、ローカル環境のアプリを実際のブラウザで操作して動作確認するための手順です。
テストスクリプトは書かず、Claude Code が MCP のブラウザ操作ツール（クリック・入力・ファイルアップロード・ネットワーク確認など）で画面を操作します。

> 自動テスト（`@playwright/test` による E2E テスト）は MVP 後に導入予定で、本ドキュメントの対象外です。

---

## 1. 前提条件

| 項目 | 内容 | 確認方法 |
|------|------|----------|
| Claude Code | CLI または VS Code 拡張 | - |
| Node.js | `npx` が使えること | `npx --version` |
| Google Chrome | Playwright MCP は既定で Chrome 安定版（`/opt/google/chrome/chrome`）を使う | `ls /opt/google/chrome/chrome` |
| 日本語フォント | ないと画面やスクリーンショットの日本語が豆腐（□）表示になる | `fc-list :lang=ja` |
| GUI 表示（WSL の場合） | WSLg が有効でブラウザのウィンドウが表示できること | `echo $DISPLAY` が空でない |
| Docker | ローカル Supabase の起動に必要 | `docker ps` |

### 1.1 Chrome のインストール

```bash
npx playwright install chrome
```

`/opt` に書き込むため sudo のパスワードを求められることがあります。

### 1.2 日本語フォントのインストール（Linux / WSL）

```bash
sudo apt update && sudo apt install -y fonts-noto-cjk
fc-cache -f
```

インストール後はブラウザを開き直してください（起動中のブラウザには反映されません）。

### 1.3 WSL でのブラウザ表示について

- WSL 上の Chrome は Windows のタスクバーに **ペンギン（Linux）マーク付き** で表示されます。普段の Windows 版 Chrome とは別物です。
- ウィンドウが出ない場合は PowerShell で `wsl --shutdown` を実行し、WSL を再起動してください。

---

## 2. MCP サーバーの設定

リポジトリ直下の [`.mcp.json`](../.mcp.json) に Playwright MCP が登録されています。

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

- 初めてこのリポジトリで Claude Code を起動すると、プロジェクトの MCP サーバーを使うか確認されるので許可してください。
- バージョンは `@latest` のため、起動のたびに最新版が使われます。本ドキュメントの「ハマりどころ」は `0.0.85` で確認した挙動なので、新しいバージョンで動きが変わっていたらドキュメントを更新してください。
- `/mcp` コマンドで `playwright` が接続済みになっていれば利用できます。

---

## 3. ローカル環境の準備

### 3.1 Supabase の起動と初期化

```bash
cd donation-management/donation-management-back
npx supabase start
npx supabase db reset   # マイグレーション適用 + seed.sql 投入
```

`db reset` はローカル DB のデータをすべて作り直します。

### 3.2 フロントエンドの環境変数

`donation-management/donation-management-front/.env.local` を作成し、ローカル Supabase を向けます。

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<npx supabase status で表示される anon key>
VITE_REQUIRE_HAPINS_DOMAIN=false
```

`VITE_REQUIRE_HAPINS_DOMAIN` が `true` だと `@hapins.net` 以外のメールアドレスを拒否するため、後述のテストユーザー（`@company.com`）でログインできません。

### 3.3 開発サーバーの起動

```bash
cd donation-management/donation-management-front
pnpm dev
```

### 3.4 テストユーザー

`seed.sql` で次のユーザーが作成されます（ローカル専用）。

| メールアドレス | パスワード | ロール | ユーザー ID |
|----------------|------------|--------|-------------|
| e2e-a@company.com | E2eTest#2026 | user | 3a5ef379-bc1f-4639-8ef1-cf1d056e38a4 |
| e2e-b@company.com | E2eTest#2026 | user | a228b11d-e42b-4ef3-a2e9-3e624151b840 |

2 人いるので、「他人の寄贈物は編集できない」といった権限の確認にも使えます。

---

## 4. 使い方

Claude Code に確認したい操作を日本語で依頼します。

```text
Playwright MCP で http://localhost:5173 を開き、e2e-a でログインして
寄贈物を画像付きで登録し、Storage へのアップロード先を確認してください。
テストスクリプトは書かず、MCP ツールだけで操作すること。
```

依頼時に次を伝えると確認がスムーズです。

- ログインするユーザー
- 確認したい画面操作と期待結果
- ネットワークリクエスト・コンソールエラー・DB の状態など、何を検証するか
- テストデータを区別するため、タイトルにタイムスタンプを付けること

---

## 5. ハマりどころ

### 5.1 ファイルアップロード

- 画像の `<input type="file" id="file-upload">` は非表示のため、直接クリックするとタイムアウトします。
- 「PCからアップロード」の `div` をクリックしてもファイル選択ダイアログは開きません。
- **`label[for="file-upload"]` をクリック** するとダイアログが開き、`browser_file_upload` が使えるようになります。
- アップロードできるのは **ワークスペース配下のファイルのみ** です。`/tmp` などのファイルは拒否されるため、`.playwright-mcp/` にコピーしてから指定します。

### 5.2 要素の指定

- スナップショットの ref（`e123` など）は画面が変わると無効になります。失敗したらスナップショットを取り直すか、CSS セレクタ（例: `button:has-text("更新する")`）で指定します。
- 一覧のタイトル文字はクリックできません。各カード（`.donation-card`）内の「詳細を見る」ボタンを使います。
- 同じ名前のボタンが複数ある場合、MCP は `.first()` でクリックすることがあります。`.donation-card:has-text("タイトル")` のようにカードを絞り込んで操作してください。

### 5.3 ローカル Supabase

- Kong（`:54321`）が固まって応答しなくなることがあります。その場合は次で復旧します。

  ```bash
  docker restart supabase_kong_donation-management-back
  ```

- ホストから DB ポート `54322` に接続できない場合は、`docker exec` 経由で SQL を実行します。

  ```bash
  docker exec -i supabase_db_donation-management-back psql -U postgres -d postgres -c "select name from storage.objects limit 5"
  ```

### 5.4 出力ファイル

MCP はスナップショット（`page-*.yml`）やコンソールログ、スクリーンショットをリポジトリ直下の `.playwright-mcp/` に書き出します。
このフォルダは `.gitignore` 済みで、不要になったら削除して構いません（次回利用時に自動で作り直されます）。
