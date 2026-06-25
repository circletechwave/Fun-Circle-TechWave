# データベース復元手順書

## 📋 概要

GitHub Actionsで作成されたSupabaseデータベースのバックアップファイルから、データベースを復元する手順を説明します。

## ⚠️ 重要な注意事項

- **復元作業は既存データを完全に削除します**
- 本番環境での復元は慎重に行ってください
- 可能な限り、まずステージング環境やローカル環境でテストしてください
- 復元前に現在のデータベースのバックアップを取得してください

---

## 🔍 バックアップファイルの取得

### 1. GitHubからバックアップファイルをダウンロード

```bash
# 1. GitHubリポジトリのActionsタブにアクセス
https://github.com/circletechwave/Fun-Circle-TechWave/actions

# 2. "Supabase Database Backup" ワークフローを選択

# 3. 復元したい日付の実行を選択

# 4. ページ下部の "Artifacts" セクションから以下をダウンロード
# - supabase_full_backup_YYYY-MM-DD_HH-MM-SS.sql
```

### 2. ファイルを解凍

```bash
# ダウンロードしたZIPファイルを解凍
unzip supabase_full_backup_2026-06-25_09-00-00.zip
```

---

## 🔧 復元方法

### オプション1: ローカル環境で復元（推奨：テスト用）

```bash
# ローカルのSupabaseを起動
npx supabase start

# 復元実行
psql "postgresql://postgres:postgres@localhost:54322/postgres" \
  -f supabase_full_backup_2026-06-25_09-00-00.sql

# 復元確認
npx supabase db diff
```

### オプション2: Supabase本番環境に復元（⚠️ 危険）

**事前準備:**

```bash
# 1. 現在のデータベースをバックアップ（念のため）
pg_dump "$SUPABASE_DB_URL" > current_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. バックアップが正常に作成されたか確認
ls -lh current_backup_*.sql
```

**復元実行:**

```bash
# Supabase本番環境に復元
# 注意: --cleanオプションにより既存データが削除されます
psql "$SUPABASE_DB_URL" -f supabase_full_backup_2026-06-25_09-00-00.sql
```

**エラーが発生した場合:**

```bash
# より詳細なログを出力して実行
psql "$SUPABASE_DB_URL" -f supabase_full_backup_2026-06-25_09-00-00.sql -v ON_ERROR_STOP=1 2>&1 | tee restore.log
```

---

## ✅ 復元後の確認項目

### 1. テーブルとデータの確認

```sql
-- データベースに接続
psql "$SUPABASE_DB_URL"

-- テーブル一覧を確認
\dt public.*
\dt auth.*
\dt storage.*

-- レコード数を確認
SELECT 'donations' as table_name, COUNT(*) FROM public.donations
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'lendings', COUNT(*) FROM public.lendings;

-- 最新のレコードを確認
SELECT * FROM public.donations ORDER BY created_at DESC LIMIT 5;
```

### 2. RLSポリシーの確認

```sql
-- RLSが有効か確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- ポリシー一覧を確認
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 3. トリガーと関数の確認

```sql
-- トリガー一覧
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 関数一覧
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';
```

### 4. 認証機能の確認

```bash
# フロントエンドアプリケーションから以下を確認:
# 1. Google OAuth ログインが動作するか
# 2. ユーザー情報が正しく表示されるか
# 3. RLSポリシーが正しく機能しているか
```

---

## 🚨 トラブルシューティング

### エラー: "database already exists"

```bash
# データベースを手動で削除してから復元
dropdb -h <host> -U <user> <database_name>
psql "$SUPABASE_DB_URL" -f backup.sql
```

### エラー: "permission denied"

```bash
# Supabaseの管理者権限で接続しているか確認
# SUPABASE_DB_URLが正しいか確認（サービスロールキーを使用）
echo $SUPABASE_DB_URL
```

### エラー: "role does not exist"

```bash
# バックアップファイルに含まれるロール名が環境に存在しない場合
# --no-ownerオプションを追加して復元
psql "$SUPABASE_DB_URL" --set ON_ERROR_STOP=off -f backup.sql
```

### 一部のスキーマがバックアップされていない

```bash
# すべてのスキーマを確認
psql "$SUPABASE_DB_URL" -c "\dn"

# 不足しているスキーマがある場合、手動でバックアップ
pg_dump "$SUPABASE_DB_URL" --schema=missing_schema > missing_schema_backup.sql
```

---

## 📊 復元検証チェックリスト

復元後、以下を確認してください：

- [ ] すべてのテーブルが存在する
- [ ] データ件数が期待通り
- [ ] RLSポリシーが有効
- [ ] トリガーが動作している
- [ ] Google OAuth認証が動作する
- [ ] フロントエンドアプリケーションが正常動作する
- [ ] 寄贈物の登録・編集・削除が可能
- [ ] 貸出・返却機能が動作する
- [ ] ユーザー権限が正しく設定されている

---

## 🔄 定期的な復元テスト

災害復旧計画（DRP）の一環として、定期的に復元テストを実施してください：

### 推奨スケジュール

- **月次**: ローカル環境での復元テスト
- **四半期**: ステージング環境での完全復元テスト
- **年次**: 災害復旧シミュレーション（本番同等環境）

### 復元テストスクリプト（例）

```bash
#!/bin/bash
# restore_test.sh - 自動復元テストスクリプト

set -e

BACKUP_FILE=$1
TEST_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

echo "🔍 Starting restore test..."

# ローカルSupabase起動
npx supabase start

# 復元実行
echo "📥 Restoring backup: $BACKUP_FILE"
psql "$TEST_DB_URL" -f "$BACKUP_FILE"

# データ検証
echo "✅ Validating data..."
psql "$TEST_DB_URL" -c "SELECT COUNT(*) FROM public.donations;"
psql "$TEST_DB_URL" -c "SELECT COUNT(*) FROM public.users;"

# クリーンアップ
echo "🧹 Cleaning up..."
npx supabase stop

echo "✅ Restore test completed successfully!"
```

---

## 📞 サポート

復元作業で問題が発生した場合：

1. **ログを確認**: `restore.log`ファイルにエラー詳細が記録されています
2. **チームに連絡**: Googleチャットで技術統括（工藤）に報告
3. **GitHubでIssue作成**: https://github.com/circletechwave/Fun-Circle-TechWave/issues

---

**最終更新**: 2026年6月25日
**作成者**: Fun-Circle-TechWave
**レビュー**: 工藤（技術統括）
