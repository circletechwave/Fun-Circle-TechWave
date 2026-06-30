# GitHub Secrets 設定ガイド

## 📋 概要

GitHub ActionsでSupabaseバックアップワークフローを実行するために必要なSecretsの設定方法を説明します。

---

## 🔑 必要なSecrets一覧

| Secret名 | 説明 | 取得方法 |
|----------|------|----------|
| `SUPABASE_DB_URL` | データベース接続文字列 | Supabase Dashboard > Settings > Database |
| `SUPABASE_URL` | SupabaseプロジェクトURL | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | サービスロールキー | Supabase Dashboard > Settings > API |

---

## 🔧 設定手順

### 1. SUPABASE_DB_URL の取得と設定

**取得方法:**

1. Supabase Dashboardにログイン
2. プロジェクトを選択
3. **Settings** > **Database** をクリック
4. **Connection string** セクションの **URI** タブを選択
5. 以下のような形式の文字列をコピー:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

**設定方法:**

```bash
# GitHubリポジトリにアクセス
https://github.com/circletechwave/Fun-Circle-TechWave/settings/secrets/actions

# "New repository secret" をクリック
# Name: SUPABASE_DB_URL
# Value: 上記でコピーした接続文字列
# "Add secret" をクリック
```

---

### 2. SUPABASE_URL の取得と設定

**取得方法:**

1. Supabase Dashboardにログイン
2. プロジェクトを選択
3. **Settings** > **API** をクリック
4. **Project URL** をコピー:
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

**設定方法:**

```bash
# GitHubリポジトリにアクセス
https://github.com/circletechwave/Fun-Circle-TechWave/settings/secrets/actions

# "New repository secret" をクリック
# Name: SUPABASE_URL
# Value: 上記でコピーしたURL
# "Add secret" をクリック
```

---

### 3. SUPABASE_SERVICE_ROLE_KEY の取得と設定

**⚠️ 重要: このキーは非常に強力な権限を持ちます。絶対に公開しないでください！**

**取得方法:**

1. Supabase Dashboardにログイン
2. プロジェクトを選択
3. **Settings** > **API** をクリック
4. **Project API keys** セクションの **service_role** キーをコピー
   - `secret` と表示されている場合は、👁️アイコンをクリックして表示
   - `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` のような長い文字列

**設定方法:**

```bash
# GitHubリポジトリにアクセス
https://github.com/circletechwave/Fun-Circle-TechWave/settings/secrets/actions

# "New repository secret" をクリック
# Name: SUPABASE_SERVICE_ROLE_KEY
# Value: 上記でコピーしたサービスロールキー
# "Add secret" をクリック
```

---

## ✅ 設定確認

すべてのSecretsが正しく設定されているか確認します：

### GitHub UIで確認

```bash
# GitHubリポジトリの Secrets ページにアクセス
https://github.com/circletechwave/Fun-Circle-TechWave/settings/secrets/actions

# 以下の3つが表示されていればOK:
# - SUPABASE_DB_URL
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

### ワークフロー実行で確認

```bash
# GitHubリポジトリの Actions タブにアクセス
https://github.com/circletechwave/Fun-Circle-TechWave/actions

# "Supabase Database Backup" ワークフローを手動実行:
# 1. ワークフローを選択
# 2. "Run workflow" をクリック
# 3. ブランチを選択して "Run workflow" をクリック

# 実行が成功すれば、Secretsが正しく設定されています
# 失敗した場合は、ログを確認してエラーメッセージを確認
```

---

## 🚨 セキュリティ注意事項

### DO (推奨)

- ✅ Secretsは必ずGitHub Secretsに保存する
- ✅ サービスロールキーは絶対にコードにハードコードしない
- ✅ 定期的にキーをローテーションする（3-6ヶ月ごと）
- ✅ Secretsへのアクセスは必要最小限のメンバーに制限

### DON'T (禁止)

- ❌ Secretsをコードにコミットしない
- ❌ Secretsを.envファイルにコミットしない
- ❌ Secretsをチャットやメールで共有しない
- ❌ Secretsをスクリーンショットに含めない
- ❌ 本番環境のキーを開発環境で使用しない

---

## 🔄 キーのローテーション

定期的にキーをローテーションすることを推奨します：

### SUPABASE_SERVICE_ROLE_KEY のローテーション

```bash
# 1. Supabase Dashboardで新しいサービスロールキーを生成
# （現時点では手動でのローテーションが必要）

# 2. GitHub Secretsを更新
# Settings > Secrets > SUPABASE_SERVICE_ROLE_KEY > Update

# 3. ワークフローを実行して動作確認

# 4. 問題なければ、古いキーを無効化（可能な場合）
```

---

## 📞 トラブルシューティング

### エラー: "SUPABASE_DB_URL is not set"

```bash
# 原因: Secretが設定されていない
# 解決策: 上記の手順1を参照してSecretを設定
```

### エラー: "pg_dump: connection failed"

```bash
# 原因: SUPABASE_DB_URLが間違っている
# 解決策:
# 1. Supabase Dashboardで接続文字列を再確認
# 2. パスワードが正しいか確認
# 3. プロジェクトがアクティブか確認
```

### エラー: "Storage backup failed: 401 Unauthorized"

```bash
# 原因: SUPABASE_SERVICE_ROLE_KEYが間違っているか期限切れ
# 解決策:
# 1. Supabase Dashboardでサービスロールキーを再確認
# 2. キーをコピー&ペーストする際に余分な空白が入っていないか確認
# 3. GitHub Secretsを更新
```

---

## 📚 関連ドキュメント

- [Supabase公式: Database接続](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase公式: API Keys](https://supabase.com/docs/guides/api/api-keys)
- [GitHub公式: Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**最終更新**: 2026年6月25日
**作成者**: Fun-Circle-TechWave
**レビュー**: 工藤（技術統括）
