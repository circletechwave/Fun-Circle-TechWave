# 社内寄贈物管理システム / Internal Donation Management System

## プロジェクト概要 / Project Overview

社内に寄贈された書籍・備品を効率的に管理し、社員間での共有・活用を促進するWebアプリケーション。社内開発サークル「Fun-Circle-TechWave」による週1回1時間の開発体制でMVP構築中。

Internal web application for efficiently managing donated books and equipment, promoting sharing and utilization among employees. MVP development by Fun-Circle-TechWave development circle with weekly 1-hour sessions.

**開発期間**: 2025年5月〜2025年9月  
**開発体制**: 5名チーム・週1回1時間の定例開発

---

## チーム構成 / Team Structure

| メンバー | 役割 | 担当領域 |
|---------|------|----------|
| **黒谷** | フロントエンドリーダー | React UI実装、デプロイ、OAuth連携 |
| **工藤** | バックエンドリーダー・技術統括 | API設計・実装、技術全体統括 |
| **福元** | バックエンドサポート・共通基盤 | APIロジック、TypeScript型定義 |
| **杉田** | データベース設計リーダー | ER図、PostgreSQLスキーマ設計 |
| **鷹木** | データ分析・PM補佐 | 集計クエリ、分析、進行管理 |

---

## 技術スタック / Tech Stack

### フロントエンド / Frontend
- **Framework**: React 18.3+
- **Language**: TypeScript 5.5+ (strict mode)
- **Build Tool**: Vite 5.0+
- **Styling**: TailwindCSS 3.4+
- **State Management**: @tanstack/react-query v5 + Zustand
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Deployment**: Cloudflare Pages

### バックエンド / Backend
- **Runtime**: Node.js 20 LTS / Cloudflare Workers
- **Language**: TypeScript 5.5+
- **Framework**: Hono 3.0+ (Cloudflare Workers対応)
- **Database**: Supabase (PostgreSQL 15)
- **ORM/Client**: Supabase JS Client v2
- **Authentication**: Supabase Auth + Google OAuth 2.0
- **Deployment**: Cloudflare Workers

### 開発ツール / Dev Tools
- **Package Manager**: pnpm 8+
- **Linter**: ESLint 8 + Prettier 3
- **Testing**: Vitest + React Testing Library
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions

---

## プロジェクト構造 / Project Structure

```
donation-management-system/
├── frontend/
│   ├── src/
│   │   ├── components/          # 共通UIコンポーネント
│   │   │   ├── common/          # Button, Input, Modal等
│   │   │   └── layout/          # Header, Footer, Sidebar
│   │   ├── features/            # 機能別モジュール
│   │   │   ├── donations/       # 寄贈物登録・編集
│   │   │   ├── inventory/       # 在庫管理・状況確認
│   │   │   ├── lending/         # 貸出・返却管理
│   │   │   ├── reports/         # レポート・統計
│   │   │   └── users/           # ユーザー管理
│   │   ├── hooks/               # カスタムフック
│   │   │   ├── useAuth.ts       # 認証関連
│   │   │   └── useDonations.ts  # 寄贈物データ取得
│   │   ├── lib/                 # ユーティリティ
│   │   │   ├── supabase.ts      # Supabaseクライアント
│   │   │   └── validation.ts    # Zodスキーマ
│   │   ├── types/               # 型定義
│   │   │   └── database.types.ts # Supabase自動生成型
│   │   └── App.tsx
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/              # APIルート定義
│   │   │   ├── auth.ts          # 認証エンドポイント
│   │   │   ├── donations.ts     # 寄贈物CRUD
│   │   │   └── reports.ts       # レポート生成
│   │   ├── middleware/          # ミドルウェア
│   │   │   ├── auth.ts          # JWT検証
│   │   │   └── validation.ts    # リクエスト検証
│   │   ├── services/            # ビジネスロジック
│   │   └── types/               # 型定義
│   └── wrangler.toml            # Cloudflare Workers設定
│
├── supabase/
│   ├── migrations/              # DBマイグレーション
│   │   └── 001_initial.sql      # 初期スキーマ
│   ├── seed.sql                 # テストデータ
│   └── config.toml              # Supabase設定
│
├── docs/
│   ├── DATABASE_DESIGN.md       # DB設計書
│   ├── API_SPECIFICATION.md     # API仕様書
│   └── DEPLOYMENT.md            # デプロイ手順
│
└── CLAUDE.md                    # 本ファイル
```

---

## データベース設計 / Database Schema

### 基本テーブル構造

#### users（ユーザー管理）
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    department VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('user', 'admin', 'system'))
);
```

#### donations（寄贈物）
```sql
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id),
    sub_category_id UUID REFERENCES sub_categories(id),
    donor_name VARCHAR(100),
    donated_date DATE,
    location_id UUID REFERENCES locations(id),
    status VARCHAR(50) NOT NULL DEFAULT 'available',
    description TEXT,
    isbn VARCHAR(20),
    author VARCHAR(200),
    publisher VARCHAR(200),
    published_year INTEGER,
    manufacturer VARCHAR(200),
    model_number VARCHAR(100),
    condition VARCHAR(20),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_status CHECK (status IN ('available', 'lending', 'maintenance', 'lost')),
    CONSTRAINT chk_condition CHECK (condition IN ('new', 'good', 'fair', 'poor'))
);
```

#### lendings（貸出記録）
```sql
CREATE TABLE lendings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES donations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    returned_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    purpose TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_lending_status CHECK (status IN ('active', 'returned', 'overdue'))
);
```

#### カテゴリ・マスターデータ
- **categories**: 書籍、備品、その他
- **sub_categories**: プログラミング、データベース、PC周辺機器など
- **locations**: 保管場所（本社3F共有書棚A、IT部備品庫など）
- **tags**: 初心者向け、おすすめ、新刊など

### インデックス設計
```sql
CREATE INDEX idx_donations_status ON donations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_donations_title ON donations(title);
CREATE INDEX idx_lendings_user_id ON lendings(user_id);
CREATE INDEX idx_lendings_donation_id ON lendings(donation_id);
```

### RLS（Row Level Security）ポリシー
```sql
-- 寄贈物は全員閲覧可能、編集は管理者と作成者のみ
CREATE POLICY "donations_select" ON donations
    FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "donations_insert" ON donations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "donations_update" ON donations
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'system'))
    );

-- 貸出記録は本人と管理者のみ閲覧可能
CREATE POLICY "lendings_select" ON lendings
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'system'))
    );
```

---

## 開発コマンド / Development Commands

### 初期セットアップ / Initial Setup
```bash
# リポジトリのクローン
git clone https://github.com/KurochanMasayan/Fun-Circle-TechWave.git
cd donation-management-system

# 依存関係インストール
pnpm install

# 環境変数設定（.env.local作成）
cp .env.example .env.local
# 以下を設定:
# VITE_SUPABASE_URL=your-project-url
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_GOOGLE_CLIENT_ID=your-google-client-id

# Supabaseローカル環境起動
npx supabase start

# データベース初期化
npx supabase db push
npx supabase db seed
```

### 開発サーバー起動 / Start Development
```bash
# フロントエンド開発サーバー
cd frontend && pnpm dev    # http://localhost:5173

# バックエンド開発サーバー
cd backend && pnpm dev     # http://localhost:8787

# 両方同時起動
pnpm dev:all
```

### テスト実行 / Run Tests
```bash
# ユニットテスト
pnpm test

# テストカバレッジ確認
pnpm test:coverage

# E2Eテスト（MVP後実装予定）
pnpm test:e2e
```

### ビルド・デプロイ / Build & Deploy
```bash
# フロントエンドビルド
cd frontend && pnpm build

# フロントエンドデプロイ（Cloudflare Pages）
pnpm deploy:frontend

# バックエンドデプロイ（Cloudflare Workers）
cd backend && pnpm deploy

# 型定義更新（DB変更後）
npx supabase gen types typescript > frontend/src/types/database.types.ts
```

---

## コーディング規約 / Code Conventions

### TypeScript規約

#### 必須設定
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 命名規則
- **ファイル名**: 
  - コンポーネント: `PascalCase.tsx` (例: `DonationCard.tsx`)
  - ユーティリティ: `camelCase.ts` (例: `formatDate.ts`)
  - 型定義: `types.ts` または `interface.ts`
  
- **変数・関数**: `camelCase`
  ```typescript
  const itemCount = 10;
  function calculateTotal() { }
  ```

- **定数**: `UPPER_SNAKE_CASE`
  ```typescript
  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
  const API_TIMEOUT = 30000; // 30秒
  ```

- **型・インターフェース**: `PascalCase`
  ```typescript
  interface DonationItem { }
  type UserRole = 'admin' | 'user';
  ```

- **Enum**: `PascalCase` (値は `UPPER_SNAKE_CASE`)
  ```typescript
  enum Status {
    AVAILABLE = 'available',
    LENDING = 'lending'
  }
  ```

#### 禁止事項
- ❌ `any`型の使用 → `unknown`または適切な型を定義
- ❌ `@ts-ignore`の使用 → 型エラーは必ず解決
- ❌ マジックナンバー → 定数として定義
- ❌ ネストが3段階以上 → 早期リターンで簡潔に

### React規約

#### コンポーネント定義
```typescript
// ✅ Good: 関数コンポーネント + アロー関数
interface Props {
  item: DonationItem;
  onUpdate: (id: string) => void;
}

export const DonationCard = ({ item, onUpdate }: Props) => {
  // ロジック
  return <div>...</div>;
};

// ❌ Bad: クラスコンポーネント
class DonationCard extends React.Component { }
```

#### カスタムフック
```typescript
// ✅ Good: use プレフィックス + 明確な責務
export const useDonations = (filters?: DonationFilters) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['donations', filters],
    queryFn: () => fetchDonations(filters)
  });
  
  return { donations: data, isLoading, error };
};
```

#### 状態管理パターン
```typescript
// ローカル状態: useState
const [isOpen, setIsOpen] = useState(false);

// サーバー状態: React Query
const { data, mutate } = useMutation({
  mutationFn: createDonation,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['donations'] });
    toast.success('寄贈物を登録しました');
  }
});

// グローバル状態: Zustand（最小限）
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user })
}));
```

### フォームバリデーション

#### Zod + React Hook Form パターン
```typescript
// スキーマ定義
const donationSchema = z.object({
  title: z.string()
    .min(1, '品名は必須です')
    .max(100, '100文字以内で入力してください'),
  category_id: z.string().uuid('カテゴリを選択してください'),
  quantity: z.number()
    .int('整数を入力してください')
    .positive('1以上の数値を入力してください'),
  condition: z.enum(['new', 'good', 'fair', 'poor'])
});

// フォームコンポーネント
export const DonationForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(donationSchema)
  });

  const onSubmit = async (data: z.infer<typeof donationSchema>) => {
    try {
      await createDonation(data);
      toast.success('登録しました');
    } catch (error) {
      toast.error('登録に失敗しました');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* フォーム要素 */}
    </form>
  );
};
```

---

## API設計 / API Design

### 基本仕様
- **ベースURL**: `https://api.donation.example.com`
- **認証**: Bearer Token (Supabase JWT)
- **Content-Type**: `application/json`

### エンドポイント一覧

#### 認証関連
```typescript
// ログイン（Google OAuth）
POST /auth/login
Response: { user, session }

// ログアウト
POST /auth/logout

// セッション確認
GET /auth/session
Response: { user, isAuthenticated }
```

#### 寄贈物管理
```typescript
// 一覧取得
GET /api/donations
Query: ?page=1&limit=20&status=available&category=books
Response: { 
  data: DonationItem[], 
  meta: { page, total, hasMore } 
}

// 詳細取得
GET /api/donations/:id
Response: { data: DonationItem }

// 新規登録
POST /api/donations
Body: { title, category_id, quantity, ... }
Response: { data: DonationItem }

// 更新
PATCH /api/donations/:id
Body: { status, location_id, ... }
Response: { data: DonationItem }

// 削除（論理削除）
DELETE /api/donations/:id
Response: { success: boolean }
```

#### 貸出管理
```typescript
// 貸出申請
POST /api/lendings
Body: { donation_id, purpose, due_date }
Response: { data: LendingRecord }

// 返却処理
PATCH /api/lendings/:id/return
Response: { data: LendingRecord }

// 履歴取得
GET /api/lendings/history
Query: ?user_id=xxx&status=active
Response: { data: LendingRecord[] }
```

#### レポート・統計
```typescript
// ダッシュボード統計
GET /api/reports/dashboard
Response: {
  totalDonations: number,
  activeLendings: number,
  popularItems: DonationItem[],
  recentActivities: Activity[]
}

// CSV出力
GET /api/reports/export
Query: ?format=csv&from=2025-01-01&to=2025-12-31
Response: CSV file
```

### エラーレスポンス
```typescript
// 統一エラーフォーマット
{
  error: {
    code: 'VALIDATION_ERROR',
    message: '入力内容に誤りがあります',
    details: {
      field: 'title',
      reason: '必須項目です'
    }
  }
}

// HTTPステータスコード
400: Bad Request（バリデーションエラー）
401: Unauthorized（認証エラー）
403: Forbidden（権限エラー）
404: Not Found
500: Internal Server Error
```

---

## セキュリティ要件 / Security Requirements

### 必須対策

#### 1. 入力検証
```typescript
// すべての入力をZodで検証
const sanitizedInput = donationSchema.parse(rawInput);

// SQLインジェクション対策（Supabaseクライアント使用）
const { data, error } = await supabase
  .from('donations')
  .select('*')
  .eq('id', sanitizedId); // パラメータ化クエリ
```

#### 2. 認証・認可
```typescript
// ミドルウェアで認証チェック
export const requireAuth = async (req: Request) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) throw new Error('Invalid token');
  
  return user;
};

// 権限チェック
export const requireAdmin = async (user: User) => {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (data?.role !== 'admin') {
    throw new Error('Forbidden');
  }
};
```

#### 3. データ保護
- HTTPS通信必須（Cloudflareで自動）
- 環境変数でシークレット管理
- RLSによる行レベルアクセス制御
- XSS対策（Reactの自動エスケープ活用）

#### 4. 監査ログ
```sql
-- 重要操作のログ記録
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50),
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## テスト戦略 / Testing Strategy

### テストピラミッド
```
         /\
        /E2E\      (10%) - 主要フロー
       /------\
      /統合テスト\  (30%) - API・DB連携
     /----------\
    /ユニットテスト\ (60%) - 関数・コンポーネント
   /--------------\
```

### テスト実装例

#### ユニットテスト（Vitest）
```typescript
import { describe, it, expect } from 'vitest';
import { formatDate, calculateOverdueDays } from '@/lib/utils';

describe('formatDate', () => {
  it('should format ISO date to Japanese format', () => {
    expect(formatDate('2025-08-16')).toBe('2025年8月16日');
  });
});

describe('calculateOverdueDays', () => {
  it('should return positive days when overdue', () => {
    const dueDate = new Date('2025-08-10');
    const today = new Date('2025-08-15');
    expect(calculateOverdueDays(dueDate, today)).toBe(5);
  });
});
```

#### コンポーネントテスト（React Testing Library）
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DonationCard } from '@/components/DonationCard';

describe('DonationCard', () => {
  const mockItem = {
    id: '123',
    title: 'Clean Code',
    status: 'available'
  };

  it('should display donation title', () => {
    render(<DonationCard item={mockItem} />);
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
  });

  it('should call onBorrow when button clicked', () => {
    const onBorrow = vi.fn();
    render(<DonationCard item={mockItem} onBorrow={onBorrow} />);
    
    fireEvent.click(screen.getByText('借りる'));
    expect(onBorrow).toHaveBeenCalledWith('123');
  });
});
```

### カバレッジ目標
- ビジネスロジック: 90%以上
- UIコンポーネント: 70%以上
- ユーティリティ: 100%
- 全体: 80%以上

---

## 週次開発ワークフロー / Weekly Development Workflow

### 📅 毎週木曜日 20:00-21:00

#### セッション前準備（非同期・各自）
```markdown
□ 前回の議事録確認（Googleチャット）
□ 担当タスクの進捗確認
□ 質問・課題をチャットに事前投稿
□ プルリクエストの作成（可能なら）
```

#### セッション中（60分）
```
20:00-20:10 【スタンドアップ】
  ├─ 各自の進捗報告（1人2分）
  └─ ブロッカーの共有

20:10-20:15 【前週のレビュー】
  ├─ PRレビュー結果確認
  └─ 技術的決定事項の確認

20:15-20:45 【開発作業】
  ├─ ペアプロ/モブプロ（難しい実装）
  ├─ 設計議論（新機能）
  └─ 不具合対応

20:45-20:55 【ネクストアクション】
  ├─ 今週のタスク割り当て
  ├─ 決定事項の文書化
  └─ 次回までの宿題確認

20:55-21:00 【クロージング】
  └─ 議事録作成・共有
```

#### セッション後（非同期・各自）
```markdown
□ 割り当てタスクの実装（目安: 週3-5時間）
□ コードレビュー（他メンバーのPR）
□ ドキュメント更新
□ テスト作成
```

### Git運用ルール

#### ブランチ戦略
```
main
  └── develop
        ├── feature/donation-form（黒谷）
        ├── feature/api-endpoints（工藤・福元）
        ├── feature/db-schema（杉田）
        └── fix/validation-error（緊急修正）
```

#### コミットメッセージ
```bash
# Conventional Commits形式
feat: 寄贈物登録フォームを実装
fix: バリデーションエラーの修正
docs: API仕様書を更新
test: DonationCardのテストを追加
refactor: 重複コードを共通関数に抽出
chore: 依存関係をアップデート
```

#### プルリクエスト
```markdown
## 概要
寄贈物登録フォームの実装

## 変更内容
- 入力フォームコンポーネント作成
- Zodバリデーション実装
- Supabase連携

## テスト
- [x] ローカル動作確認
- [x] ユニットテスト追加
- [x] Lintエラーなし

## レビュー依頼
@kurotani @kudo
```

---

## 開発スケジュール（MVP） / Development Schedule

### Phase 1: 基盤構築（2025年6月19日〜7月3日）
- [x] 環境構築・プロジェクト設定
- [x] Supabaseセットアップ
- [x] 認証機能実装（Google OAuth）
- [x] 基本的なルーティング

### Phase 2: コア機能実装（2025年7月10日〜8月14日）
- [ ] 寄贈物登録機能
  - [ ] 登録フォーム
  - [ ] 画像アップロード
  - [ ] バリデーション
- [ ] 一覧表示機能
  - [ ] テーブル表示
  - [ ] ページネーション
  - [ ] 検索・フィルター
- [ ] 在庫管理機能
  - [ ] ステータス更新
  - [ ] 在庫数管理
- [ ] ユーザー管理
  - [ ] プロフィール表示
  - [ ] 権限管理

### Phase 3: 機能拡張（2025年8月21日〜9月11日）
- [ ] 貸出・返却機能
- [ ] レビュー・評価機能
- [ ] 通知機能
- [ ] CSVエクスポート

### Phase 4: テスト・リリース準備（2025年9月18日〜9月30日）
- [ ] 統合テスト
- [ ] パフォーマンス改善
- [ ] ドキュメント整備
- [ ] 本番デプロイ

---

## Claude Code向け指示 / Instructions for Claude

### プロジェクトコンテキスト
このプロジェクトは日本の社内開発サークルによるMVP開発です。週1時間という限られた時間で効率的に開発を進める必要があります。

### 常に守るべきルール / Always Follow

1. **TypeScript Strict Mode**
   - すべての変数・関数に明示的な型定義
   - `any`型は絶対に使用しない

2. **エラーハンドリング**
   ```typescript
   try {
     const result = await riskyOperation();
     return { success: true, data: result };
   } catch (error) {
     console.error('Operation failed:', error);
     return { success: false, error: 'ユーザー向けエラーメッセージ' };
   }
   ```

3. **日本語コメント**
   ```typescript
   /**
    * 寄贈物を新規登録する
    * @param data - 寄贈物情報
    * @returns 登録された寄贈物
    * @throws ValidationError - 入力値が不正な場合
    */
   export const createDonation = async (data: DonationInput) => {
     // バリデーション実行
     const validated = donationSchema.parse(data);
     
     // Supabaseに登録
     const { data: donation, error } = await supabase
       .from('donations')
       .insert(validated)
       .single();
       
     if (error) throw error;
     return donation;
   };
   ```

4. **React Query使用**
   ```typescript
   // ❌ Bad: 直接fetchとuseState
   const [data, setData] = useState();
   useEffect(() => { fetch(...).then(setData) }, []);
   
   // ✅ Good: React Query
   const { data, isLoading } = useQuery({
     queryKey: ['donations'],
     queryFn: fetchDonations
   });
   ```

5. **Supabaseクライアント使用**
   ```typescript
   // ❌ Bad: 直接SQL
   const result = await sql`SELECT * FROM donations`;
   
   // ✅ Good: Supabaseクライアント
   const { data, error } = await supabase
     .from('donations')
     .select('*');
   ```

### 絶対に禁止 / Never Do

- ❌ `any`型、`@ts-ignore`の使用
- ❌ `console.log`を本番コードに残す
- ❌ 環境変数をハードコード
- ❌ パスワードや秘密情報をコミット
- ❌ 認証なしでAPIエンドポイント作成
- ❌ バリデーションなしでユーザー入力を処理
- ❌ try-catchなしで非同期処理
- ❌ mainブランチへの直接push

### コード生成時のチェックリスト

#### 新機能実装時
- [ ] 型定義ファイルを作成/更新
- [ ] Zodスキーマでバリデーション定義
- [ ] エラーハンドリング実装
- [ ] ローディング状態の実装
- [ ] テストファイル作成
- [ ] 日本語コメント追加

#### API実装時
- [ ] 認証ミドルウェア適用
- [ ] 入力バリデーション
- [ ] RLSポリシー確認
- [ ] エラーレスポンス統一
- [ ] レート制限考慮

#### UI実装時
- [ ] レスポンシブデザイン対応
- [ ] アクセシビリティ考慮
- [ ] ローディング/エラー表示
- [ ] フォームバリデーション
- [ ] 日本語メッセージ

### 効率的な実装パターン

#### データ取得パターン
```typescript
// 汎用的なデータ取得フック
export const useDonations = (filters?: DonationFilters) => {
  return useQuery({
    queryKey: ['donations', filters],
    queryFn: () => fetchDonations(filters),
    staleTime: 5 * 60 * 1000, // 5分
  });
};
```

#### フォーム処理パターン
```typescript
// React Hook Form + Zod + useMutation
export const DonationForm = () => {
  const form = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: { title: '', category_id: '' }
  });
  
  const mutation = useMutation({
    mutationFn: createDonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      toast.success('登録しました');
      form.reset();
    },
    onError: () => {
      toast.error('登録に失敗しました');
    }
  });
  
  return (
    <form onSubmit={form.handleSubmit(mutation.mutate)}>
      {/* フォーム要素 */}
    </form>
  );
};
```

---

## トラブルシューティング / Troubleshooting

### よくある問題と解決方法

#### Supabase接続エラー
```bash
# 環境変数確認
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# ローカルSupabase起動確認
npx supabase status

# 接続テスト
npx supabase db test
```

#### 型エラー
```bash
# Supabase型定義を再生成
npx supabase gen types typescript > src/types/database.types.ts

# TypeScriptキャッシュクリア
rm -rf node_modules/.cache
pnpm tsc --noEmit
```

#### 認証エラー
```bash
# Google OAuth設定確認（Supabase Dashboard）
# - Authorized redirect URIs
# - Client ID/Secret設定

# セッション確認
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

#### ビルドエラー
```bash
# 依存関係の再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install

# ビルドキャッシュクリア
rm -rf dist .parcel-cache
pnpm build
```

---

## 用語集 / Glossary

### ビジネス用語
| 日本語 | 英語 | 説明 |
|--------|------|------|
| 寄贈物 | Donation | 会社に寄贈された物品 |
| 在庫 | Inventory | 現在の保管状況 |
| 貸出 | Lending | 社員への物品貸出 |
| 返却 | Return | 借りた物品の返却 |
| 保管場所 | Location | 物品の物理的な保管場所 |

### 技術用語
| 用語 | 説明 |
|------|------|
| RLS | Row Level Security - 行レベルのアクセス制御 |
| JWT | JSON Web Token - 認証トークン |
| UUID | Universally Unique Identifier - 一意識別子 |
| SSR | Server Side Rendering - サーバーサイドレンダリング |
| SPA | Single Page Application - シングルページアプリケーション |

---

## 参考リンク / References

### 公式ドキュメント
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [TanStack Query Docs](https://tanstack.com/query/latest)

### プロジェクトリポジトリ
- [GitHub Repository](https://github.com/KurochanMasayan/Fun-Circle-TechWave)
- [Project Board](https://github.com/orgs/Fun-Circle-TechWave/projects/1)

### 内部ドキュメント
- [データベース設計書](./docs/DATABASE_DESIGN.md)
- [API仕様書](./docs/API_SPECIFICATION.md)
- [デプロイ手順書](./docs/DEPLOYMENT.md)

---

## メンテナンス記録 / Maintenance Log

| 日付 | 更新内容 | 担当 |
|------|----------|------|
| 2025-08-16 | 初版作成 | 全員 |
| 2025-07-24 | Phase2進捗更新 | 鷹木 |
| 2025-06-26 | スケジュール調整 | 工藤 |
| 2025-06-19 | DB設計完了 | 杉田 |

---

**最終更新**: 2025年8月16日  
**バージョン**: 1.0.0  
**作成**: Fun-Circle-TechWave

---

## 今後の機能拡張（MVP後） / Future Enhancements

### Phase 5: 機能強化（2025年10月〜）
- 📊 統計ダッシュボード
- 📧 メール通知システム
- 📱 モバイルアプリ開発
- 🌐 多言語対応
- 📷 QRコードによる物品管理
- 🔍 高度な検索機能（全文検索）
- 📈 利用傾向分析AI

### 技術的改善
- GraphQL API導入検討
- マイクロサービス化
- Redis導入（キャッシュ層）
- CDN最適化
- PWA対応

---

*このドキュメントは開発の進行に応じて継続的に更新されます。*
*質問・提案は Google Chat または GitHub Issues へお願いします。*
