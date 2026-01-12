# 社内寄贈物管理システム - フロントエンド

社内に寄贈された書籍・備品を効率的に管理し、社員間での共有・活用を促進するWebアプリケーションのフロントエンドです。

## 技術スタック

- **Framework**: React 18.3+
- **Language**: TypeScript 5.5+ (strict mode)
- **Build Tool**: Vite 5.0+
- **Styling**: インラインスタイル（TailwindCSS移行予定）
- **State Management**: useState + useEffect（React Query移行予定）
- **Authentication**: Supabase Auth + Google OAuth 2.0
- **Database**: Supabase (PostgreSQL 15)

## 環境構築

### 前提条件

- Node.js 20 LTS以上
- pnpm 8以上
- Supabaseアカウント

### セットアップ手順

1. **リポジトリのクローン**

```bash
git clone https://github.com/circletechwave/Fun-Circle-TechWave.git
cd Fun-Circle-TechWave/donation-management/donation-management-front
```

2. **依存関係のインストール**

```bash
pnpm install
```

3. **環境変数の設定**

`.env.example`を`.env.local`にコピーして、実際の値を設定してください。

```bash
cp .env.example .env.local
```

`.env.local`を編集して、以下の値を設定します：

```env
# Supabase設定（必須）
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 開発用ログイン認証情報（オプション）
VITE_DEV_EMAIL=admin@company.com
VITE_DEV_PASSWORD=password
```

**Supabase設定値の取得方法**:

1. [Supabase](https://supabase.com)にアクセス
2. プロジェクトを作成または選択
3. `Settings` > `API`に移動
4. `Project URL`を`VITE_SUPABASE_URL`にコピー
5. `Project API keys`の`anon public`キーを`VITE_SUPABASE_ANON_KEY`にコピー

⚠️ **重要**: 環境変数が未設定の場合、アプリケーションの起動時にエラーが発生します。必ず`.env.local`ファイルに実際の値を設定してください。

4. **開発サーバーの起動**

```bash
pnpm dev
```

ブラウザで`http://localhost:5173`にアクセスします。

5. **ビルド**

```bash
pnpm build
```

6. **型チェック**

```bash
pnpm typecheck
```

## プロジェクト構造

```
src/
├── components/           # Reactコンポーネント
│   ├── Auth.tsx         # 認証コンポーネント
│   ├── DonationForm.tsx # 寄贈物登録・編集フォーム
│   ├── DonationDetail.tsx # 寄贈物詳細表示
│   ├── DonationList.tsx   # 寄贈物一覧表示
│   └── SearchFilter.tsx   # 検索・フィルター
├── services/            # APIサービス
│   └── donationApi.ts   # 寄贈物API呼び出し
├── lib/                 # ユーティリティ
│   └── supabase.ts      # Supabaseクライアント
├── types/               # 型定義
│   └── donation.ts      # 寄贈物型定義
├── App.tsx              # メインアプリケーション
└── main.tsx             # エントリーポイント
```

## 開発ガイドライン

このプロジェクトは、`CLAUDE.md`および`CLAUDE_BEHAVIOR_CONTROL.md`に記載されているコーディング規約に準拠しています。

### 主要な規約

- ✅ TypeScript strict mode必須
- ✅ `any`型の使用禁止
- ✅ `@ts-ignore`の使用禁止
- ✅ エラーハンドリング必須（try-catch）
- ✅ 日本語コメント推奨
- ✅ 関数コンポーネントのみ使用（クラスコンポーネント禁止）
- ✅ 環境変数のハードコード禁止
- ✅ console.logは開発環境のみ（`import.meta.env.DEV`で制御）

### コード例

```typescript
// ✅ Good: 適切な型定義とエラーハンドリング
const fetchDonations = async (): Promise<Donation[]> => {
  try {
    const { data, error } = await supabase.from('donations').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to fetch donations:', error);
    }
    throw new Error('データの取得に失敗しました');
  }
};

// ❌ Bad: any型、エラーハンドリングなし
const fetchDonations = async (): Promise<any> => {
  const { data } = await supabase.from('donations').select('*');
  return data;
};
```

## トラブルシューティング

### 環境変数エラー

```
Error: 環境変数VITE_SUPABASE_URLとVITE_SUPABASE_ANON_KEYが設定されていません
```

**解決方法**: `.env.local`ファイルに正しいSupabase設定値を入力してください。

### TypeScriptコンパイルエラー

```bash
# 型チェックを実行
pnpm typecheck

# エラーがある場合は、該当ファイルを修正
```

### ビルドエラー

```bash
# キャッシュをクリアして再ビルド
rm -rf node_modules .vite dist
pnpm install
pnpm build
```

## デプロイ

このプロジェクトはCloudflare Pagesにデプロイされます。

```bash
# ビルド
pnpm build

# デプロイ（Cloudflare Pages CLIを使用）
npx wrangler pages deploy dist
```

## ライセンス

社内プロジェクト - Fun-Circle-TechWave

---

**開発チーム**: Fun-Circle-TechWave
**最終更新**: 2026-01-12
