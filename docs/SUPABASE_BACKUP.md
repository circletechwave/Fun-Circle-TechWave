# Supabaseデータベースの週次バックアップ自動化計画

GitHub Actionsを使用して、Supabaseのデータベースダンプ（スキーマおよびデータ）を1週間ごとに自動で取得し、過去1ヶ月分（30日間）を保持する仕組みを構築します。

## ユーザー側での事前設定が必要な項目

ワークフローを実行するために、GitHubリポジトリにSupabaseの接続文字列をシークレットとして登録していただく必要があります。

### 設定手順

1. 対象のGitHubリポジトリのページを開きます。
2. **Settings** -> **Secrets and variables** -> **Actions** の順に遷移します。
3. **New repository secret** ボタンをクリックします。
4. 以下の通りに入力し、**Add secret** をクリックして保存します。
   * **Name**: `SUPABASE_DB_URL`
   * **Secret**: Supabaseのデータベース接続文字列（Transaction connection string）
     * 形式: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
     * ※ `[YOUR-PASSWORD]` にはデータベースのパスワード、`[YOUR-PROJECT-REF]` にはSupabaseのプロジェクト参照IDを入れてください。パスワードに特殊文字が含まれる場合はURLエンコードが必要な場合があります。

> [!WARNING]
> 本番データベースの接続情報を扱うため、`SUPABASE_DB_URL` は必ずリポジトリのシークレットとして厳重に管理してください。

---

## 提案する変更内容

### [GitHub Actions]

#### [NEW] [supabase-backup.yml](file:///Users/owner/Desktop/%E3%82%B5%E3%83%BC%E3%82%AF%E3%83%AB/%E4%BB%95%E5%88%87%E3%82%8A%E7%9B%B4%E3%81%97/Fun-Circle-TechWave/%E5%90%8D%E7%A7%B0%E6%9C%AA%E8%A8%AD%E5%AE%9A/Fun-Circle-TechWave/.github/workflows/supabase-backup.yml)

週次（毎週日曜日 AM 9:00 JST）および手動実行トリガーで動作し、`pg_dump` を用いてデータベースダンプを取得します。
取得したダンプファイルをGitHubのArtifacts（成果物）として **30日間** 保存します。これにより、自動的に過去1ヶ月分（4〜5回分）のバックアップが保持されます。

```yaml
name: Supabase Database Backup

on:
  schedule:
    # 毎週日曜日 00:00 UTC (日本時間 09:00) に定期実行
    - cron: '0 0 * * 0'
  workflow_dispatch: # GitHubのUIから手動でバックアップを実行可能にする

jobs:
  backup:
    name: Database Backup
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client

      - name: Run pg_dump
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_DB_URL }}
        run: |
          if [ -z "$SUPABASE_DB_URL" ]; then
            echo "Error: SUPABASE_DB_URL is not set."
            exit 1
          fi
          
          # バックアップファイル名に実行時の日付を付与 (例: supabase_backup_2026-06-24.sql)
          BACKUP_DATE=$(date +'%Y-%m-%d')
          FILENAME="supabase_backup_${BACKUP_DATE}.sql"
          
          echo "Starting pg_dump..."
          # スキーマとデータの両方をダンプ（ロール、所有者、権限情報は除外して汎用性を高める）
          pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges > "$FILENAME"
          
          echo "Database dump created: $FILENAME"
          # ファイル名を環境変数経由で次のステップに渡す
          echo "FILENAME=$FILENAME" >> $GITHUB_ENV

      - name: Upload Backup Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ env.FILENAME }}
          path: ${{ env.FILENAME }}
          # 30日間（約1ヶ月）保存し、期限が切れたら自動削除する
          retention-days: 30
```

---

## 検証プラン

### 手動検証
1. GitHubのシークレット `SUPABASE_DB_URL` を設定後、GitHubのActionsタブに移動します。
2. 作成された「Supabase Database Backup」ワークフローを選択し、**Run workflow** ボタンから手動で実行します。
3. ワークフローが正常に完了し、実行結果の画面（Summary）からダンプファイルが Artifact としてダウンロード可能であること、および保存期限が30日間に設定されていることを確認します。
