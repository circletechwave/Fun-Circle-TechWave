# CLAUDE.md - 社内寄贈物管理システム

このファイルはClaude Codeがプロジェクトの規約に従ったコードを生成するための設定ファイルです。
**重要**: すべてのコード生成において、このファイルの規則を最優先で適用してください。

---

## 🚫 絶対禁止事項 / NEVER DO THIS

以下のパターンは**いかなる場合も生成しないこと**：

### ❌ TypeScript禁止パターン

```typescript
// ❌ WRONG - any型は絶対禁止
const data: any = await fetchData();
let result: any;
function process(input: any): any { }

// ✅ CORRECT - 必ず適切な型を使用
const data: DonationItem[] = await fetchData();
let result: string | undefined;
function process(input: unknown): ProcessResult { }
```

```typescript
// ❌ WRONG - @ts-ignore, @ts-nocheck は絶対禁止
// @ts-ignore
const value = someFunction();

// ✅ CORRECT - 型エラーは必ず解決
const value = someFunction() as ExpectedType;
// または型ガードを使用
if (isExpectedType(value)) { ... }
```

```typescript
// ❌ WRONG - 非null assertion演算子の乱用
const element = document.querySelector('.class')!;
const value = data.property!;

// ✅ CORRECT - 適切なnullチェック
const element = document.querySelector('.class');
if (!element) throw new Error('要素が見つかりません');

const value = data.property ?? defaultValue;
```

### ❌ React禁止パターン

```typescript
// ❌ WRONG - クラスコンポーネント禁止
class MyComponent extends React.Component { }

// ✅ CORRECT - 関数コンポーネントのみ
const MyComponent = ({ props }: Props) => { }
```

```typescript
// ❌ WRONG - 直接的なDOM操作禁止
document.getElementById('button')?.addEventListener('click', handler);
element.innerHTML = '<div>content</div>';

// ✅ CORRECT - React の方法を使用
<button onClick={handler}>Click</button>
<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

```typescript
// ❌ WRONG - useEffectの依存配列漏れ
useEffect(() => {
  doSomething(value);
}, []); // valueが依存配列にない

// ✅ CORRECT - 完全な依存配列
useEffect(() => {
  doSomething(value);
}, [value]);
```

### ❌ 非同期処理禁止パターン

```typescript
// ❌ WRONG - エラーハンドリングなし
const data = await fetchData();

// ❌ WRONG - console.logを本番コードに残す
console.log('debug', data);

// ✅ CORRECT - 必ずtry-catchとローディング状態
setLoading(true);
try {
  const data = await fetchData();
  // 成功処理
} catch (error) {
  console.error('Error fetching data:', error); // errorレベルはOK
  toast.error('データの取得に失敗しました');
} finally {
  setLoading(false);
}
```

### ❌ セキュリティ禁止パターン

```typescript
// ❌ WRONG - 環境変数のハードコード
const API_KEY = "sk-1234567890abcdef";
const SUPABASE_URL = "https://xxxx.supabase.co";

// ✅ CORRECT - 環境変数から取得
const API_KEY = import.meta.env.VITE_API_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
```

```typescript
// ❌ WRONG - SQLインジェクション脆弱性
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// ✅ CORRECT - Supabaseクライアントを使用
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

---

## ✅ 必須パターン / ALWAYS FOLLOW THESE PATTERNS

### 📌 すべてのコンポーネント作成時

```typescript
// 必ずこの構造で作成すること

// 1. インポート順序を厳守
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/utils/format';
import type { DonationItem } from '@/types/database.types';

// 2. Props型を明示的に定義
interface DonationCardProps {
  item: DonationItem;
  onUpdate?: (id: string) => void;
  className?: string;
}

// 3. コンポーネントは必ずexport const形式
export const DonationCard = ({ 
  item, 
  onUpdate,
  className = ''
}: DonationCardProps) => {
  // 4. エラー境界を考慮
  if (!item) {
    return <div>データがありません</div>;
  }

  // 5. イベントハンドラーはhandle接頭辞
  const handleUpdate = () => {
    onUpdate?.(item.id);
  };

  // 6. 条件付きレンダリングは早期リターン
  if (item.status === 'deleted') {
    return null;
  }

  return (
    <div className={`donation-card ${className}`}>
      {/* 7. 日本語のaria-label */}
      <button 
        onClick={handleUpdate}
        aria-label="寄贈物を更新"
        disabled={!onUpdate}
      >
        更新
      </button>
    </div>
  );
};

// 8. 同じファイルにテストも記載（小規模なコンポーネントの場合）
// または別ファイル DonationCard.test.tsx を同時作成
```

### 📌 フォーム実装時の必須パターン

```typescript
// フォームは必ずこのパターンで実装

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';

// 1. Zodスキーマを最初に定義（日本語エラーメッセージ）
const donationFormSchema = z.object({
  title: z.string()
    .min(1, '品名は必須です')
    .max(100, '品名は100文字以内で入力してください'),
  category_id: z.string()
    .uuid('有効なカテゴリを選択してください'),
  quantity: z.number()
    .int('数量は整数で入力してください')
    .positive('数量は1以上で入力してください')
    .max(999, '数量は999以下で入力してください'),
  donor_name: z.string()
    .min(1, '寄贈者名は必須です'),
  description: z.string()
    .max(500, '説明は500文字以内で入力してください')
    .optional(),
  donated_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付は YYYY-MM-DD 形式で入力してください'),
});

type DonationFormData = z.infer<typeof donationFormSchema>;

export const DonationForm = () => {
  const queryClient = useQueryClient();
  
  // 2. React Hook Form設定
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      quantity: 1,
      donated_date: new Date().toISOString().split('T')[0]
    }
  });

  // 3. useMutationでAPI呼び出し
  const createMutation = useMutation({
    mutationFn: async (data: DonationFormData) => {
      const { data: result, error } = await supabase
        .from('donations')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      // 4. 成功時の処理（日本語メッセージ）
      toast.success('寄贈物を登録しました');
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      reset();
    },
    onError: (error) => {
      // 5. エラー時の処理（ユーザーフレンドリーなメッセージ）
      console.error('登録エラー:', error);
      toast.error('登録に失敗しました。もう一度お試しください。');
    }
  });

  // 6. フォーム送信ハンドラー
  const onSubmit = handleSubmit((data) => {
    createMutation.mutate(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* 7. エラーメッセージ表示 */}
      <div>
        <label htmlFor="title">
          品名 <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          id="title"
          className={errors.title ? 'border-red-500' : ''}
          aria-invalid={!!errors.title}
          aria-describedby="title-error"
        />
        {errors.title && (
          <p id="title-error" className="text-red-500 text-sm mt-1">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* 8. 送信ボタン（送信中は無効化） */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary"
      >
        {isSubmitting ? '登録中...' : '登録する'}
      </button>
    </form>
  );
};
```

### 📌 API呼び出しの必須パターン

```typescript
// APIは必ずReact Queryを使用、直接fetchは禁止

// ✅ データ取得パターン
export const useDonations = (filters?: DonationFilters) => {
  return useQuery({
    queryKey: ['donations', filters],
    queryFn: async () => {
      const query = supabase
        .from('donations')
        .select(`
          *,
          categories (name),
          locations (name, building, floor)
        `)
        .order('created_at', { ascending: false });

      // フィルター適用
      if (filters?.status) {
        query.eq('status', filters.status);
      }
      if (filters?.category_id) {
        query.eq('category_id', filters.category_id);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Fetch error:', error);
        throw new Error('データの取得に失敗しました');
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 10 * 60 * 1000, // 10分（旧 cacheTime）
    retry: 2,
    retryDelay: 1000,
  });
};

// ✅ データ更新パターン
export const useUpdateDonation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DonationItem> }) => {
      const { data: result, error } = await supabase
        .from('donations')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      // キャッシュ更新
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.setQueryData(['donations', data.id], data);
      toast.success('更新しました');
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('更新に失敗しました');
    }
  });
};
```

### 📌 エラーハンドリングの必須パターン

```typescript
// すべての非同期処理で以下のパターンを適用

// 1. ユーティリティ関数
export const handleApiError = (error: unknown): string => {
  // Supabaseエラー
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string };
    
    // エラーコードに応じた日本語メッセージ
    switch (supabaseError.code) {
      case '23505':
        return 'すでに登録されています';
      case '23503':
        return '関連データが見つかりません';
      case '22P02':
        return '入力形式が正しくありません';
      case 'PGRST116':
        return 'データが見つかりません';
      default:
        return 'エラーが発生しました。しばらくしてから再度お試しください';
    }
  }
  
  // 一般的なエラー
  if (error instanceof Error) {
    // 開発環境ではエラー詳細を表示
    if (import.meta.env.DEV) {
      return error.message;
    }
  }
  
  return '予期しないエラーが発生しました';
};

// 2. 使用例
const handleDelete = async (id: string) => {
  if (!confirm('本当に削除しますか？この操作は取り消せません。')) {
    return;
  }

  setDeleting(true);
  
  try {
    const { error } = await supabase
      .from('donations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
    
    toast.success('削除しました');
    router.push('/donations');
    
  } catch (error) {
    const message = handleApiError(error);
    toast.error(message);
    
  } finally {
    setDeleting(false);
  }
};
```

### 📌 状態管理の必須パターン

```typescript
// 状態管理は用途に応じて使い分ける

// 1. ローカル状態（コンポーネント内）
const [isOpen, setIsOpen] = useState(false);
const [selectedItems, setSelectedItems] = useState<string[]>([]);

// 2. サーバー状態（React Query）
// 取得・更新は上記のuseQuery/useMutationパターンを使用

// 3. グローバル状態（Zustand - 最小限に留める）
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        // Supabase認証もクリア
        supabase.auth.signOut();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // userのみ永続化
    }
  )
);

// 4. URL状態（検索フィルターなど）
import { useSearchParams } from 'react-router-dom';

export const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filters = {
    status: searchParams.get('status') || 'all',
    category: searchParams.get('category') || '',
    search: searchParams.get('q') || '',
  };
  
  const updateFilter = (key: string, value: string) => {
    setSearchParams(prev => {
      if (value) {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      return prev;
    });
  };
  
  return { filters, updateFilter };
};
```

---

## 📝 コメントと命名規則 / Comments and Naming Rules

### 日本語と英語の使い分けルール

```typescript
/**
 * 寄贈物の在庫状況を計算する
 * @param items - 寄贈物リスト
 * @returns 在庫サマリー
 */
export const calculateInventoryStatus = (
  items: DonationItem[]  // 型情報は英語
): InventoryStatus => {
  // ビジネスロジックの説明は日本語
  // 利用可能な寄贈物のみをカウント
  const available = items.filter(item => 
    item.status === 'available' && !item.deleted_at
  );
  
  // メンテナンス中の物品を集計
  const maintenance = items.filter(item => 
    item.status === 'maintenance'
  );
  
  // エラーメッセージは日本語
  if (items.length === 0) {
    throw new Error('寄贈物データが存在しません');
  }
  
  // オブジェクトのキーは英語
  return {
    total: items.length,
    available: available.length,
    maintenance: maintenance.length,
    // UIに表示するメッセージは日本語
    message: `${available.length}件が利用可能です`,
  };
};

// ユーザー向けメッセージは必ず日本語
toast.success('登録が完了しました');
toast.error('ネットワークエラーが発生しました');
toast.info('新しい寄贈物があります');
```

### ファイル・ディレクトリ命名規則

```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx          # コンポーネント: PascalCase
│   │   ├── Button.test.tsx     # テスト: *.test.tsx
│   │   └── Button.stories.tsx  # Storybook: *.stories.tsx
│   └── features/
│       └── donations/
│           ├── DonationForm.tsx
│           ├── DonationList.tsx
│           └── useDonations.ts  # hooks: camelCase
├── utils/
│   ├── formatters.ts            # ユーティリティ: camelCase
│   ├── validators.ts
│   └── constants.ts             # 定数ファイル: camelCase
├── types/
│   ├── database.types.ts        # 型定義: *.types.ts
│   └── api.types.ts
└── stores/
    └── authStore.ts             # Store: camelCase + Store
```

---

## 🔒 セキュリティ必須実装 / Security Requirements

### 認証・認可チェック

```typescript
// すべての保護されたルートで認証チェック

// 1. ルートレベルの保護
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// 2. コンポーネントレベルの権限チェック
export const AdminOnlySection = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthStore();
  
  // 管理者以外は表示しない
  if (user?.role !== 'admin') {
    return null;
  }
  
  return <>{children}</>;
};

// 3. API呼び出し時の認証ヘッダー
// Supabaseが自動的に処理するが、カスタムAPIの場合：
const callCustomAPI = async (endpoint: string, data: any) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('認証が必要です');
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('APIエラーが発生しました');
  }
  
  return response.json();
};
```

### 入力値検証

```typescript
// すべてのユーザー入力はZodで検証

// 危険な文字のサニタイズ
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // HTMLタグを除去
    .trim()
    .slice(0, 1000); // 最大文字数制限
};

// ファイルアップロードの検証
const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'ファイルサイズは5MB以下にしてください',
    })
    .refine((file) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      return allowedTypes.includes(file.type);
    }, {
      message: 'JPG、PNG、WebP形式のみアップロード可能です',
    }),
});

// URLパラメータの検証
const validateId = (id: string | undefined): string => {
  if (!id || !z.string().uuid().safeParse(id).success) {
    throw new Error('無効なIDです');
  }
  return id;
};
```

---

## 🧪 テスト作成ルール / Test Creation Rules

### 新しい機能を作成したら必ずテストも作成

```typescript
// ファイル: components/DonationCard.tsx
export const DonationCard = ({ item, onEdit }: Props) => {
  // 実装
};

// 同時に作成: components/DonationCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { DonationCard } from './DonationCard';

describe('DonationCard', () => {
  const mockItem = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Clean Code',
    status: 'available',
    category: { name: '書籍' },
  };

  // 正常系テスト
  it('should display donation information', () => {
    render(<DonationCard item={mockItem} />);
    
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('書籍')).toBeInTheDocument();
    expect(screen.getByText('利用可能')).toBeInTheDocument();
  });

  // イベントハンドラーテスト
  it('should call onEdit when edit button is clicked', async () => {
    const onEdit = vi.fn();
    render(<DonationCard item={mockItem} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: /編集/ });
    fireEvent.click(editButton);
    
    await waitFor(() => {
      expect(onEdit).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });
  });

  // エッジケース
  it('should handle missing category gracefully', () => {
    const itemWithoutCategory = { ...mockItem, category: undefined };
    render(<DonationCard item={itemWithoutCategory} />);
    
    expect(screen.getByText('カテゴリなし')).toBeInTheDocument();
  });

  // アクセシビリティテスト
  it('should have proper ARIA labels', () => {
    render(<DonationCard item={mockItem} />);
    
    const editButton = screen.getByRole('button', { name: /編集/ });
    expect(editButton).toHaveAttribute('aria-label');
  });
});

// ユーティリティ関数のテスト
describe('calculateInventoryStatus', () => {
  it('should calculate correct totals', () => {
    const items = [
      { status: 'available' },
      { status: 'available' },
      { status: 'maintenance' },
    ];
    
    const result = calculateInventoryStatus(items);
    
    expect(result).toEqual({
      total: 3,
      available: 2,
      maintenance: 1,
      message: '2件が利用可能です',
    });
  });

  it('should throw error for empty array', () => {
    expect(() => calculateInventoryStatus([])).toThrow('寄贈物データが存在しません');
  });
});
```

---

## 🚀 パフォーマンス最適化ルール

```typescript
// 1. メモ化を適切に使用
const DonationList = ({ items, filters }: Props) => {
  // 重い計算はuseMemo
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 複雑なフィルタリングロジック
    });
  }, [items, filters]);

  // コールバックはuseCallback
  const handleItemClick = useCallback((id: string) => {
    // 処理
  }, []);

  return (
    <VirtualList
      items={filteredItems}
      itemHeight={80}
      renderItem={(item) => (
        <DonationCard
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      )}
    />
  );
};

// 2. 遅延読み込み
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// 3. 画像の最適化
<img
  src={imageUrl}
  loading="lazy"
  decoding="async"
  alt={item.title}
  width={300}
  height={200}
/>

// 4. デバウンス処理
const SearchInput = () => {
  const [value, setValue] = useState('');
  const [debouncedValue] = useDebounce(value, 500);

  useEffect(() => {
    if (debouncedValue) {
      searchItems(debouncedValue);
    }
  }, [debouncedValue]);

  return <input onChange={(e) => setValue(e.target.value)} />;
};
```

---

## 🎯 プロジェクト固有ルール / Project Specific Rules

### 週1時間開発の制約を考慮

```typescript
// 1. 実装は常にシンプルに（複雑な抽象化は避ける）
// ❌ 過度な抽象化
class AbstractDonationRepository implements IDonationRepository {
  // 複雑すぎる
}

// ✅ シンプルな実装
export const donationAPI = {
  getAll: () => supabase.from('donations').select('*'),
  getById: (id: string) => supabase.from('donations').select('*').eq('id', id).single(),
  create: (data: DonationInput) => supabase.from('donations').insert(data),
};

// 2. コメントを充実させる（引き継ぎを考慮）
/**
 * 寄贈物の貸出処理
 * 
 * 処理の流れ：
 * 1. 寄贈物の利用可能状態を確認
 * 2. 貸出記録を作成
 * 3. 寄贈物のステータスを更新
 * 4. 通知を送信（Phase 3で実装予定）
 * 
 * @param donationId - 寄贈物ID
 * @param userId - 借りるユーザーのID
 * @param purpose - 利用目的
 * @param dueDate - 返却予定日
 * 
 * 担当: 工藤（2025/07/24実装）
 * レビュー: 黒谷（2025/07/25）
 */
export const lendDonation = async (...) => {
  // 実装
};

// 3. TODOコメントは具体的に
// TODO: [Phase3] メール通知機能を追加（担当：未定）
// TODO: [2025/08/21] レビュー機能実装時にこの部分を拡張
// FIXME: [優先度:高] エラーハンドリングを改善する
```

### Supabase固有のパターン

```typescript
// 1. RLSを考慮したエラーハンドリング
const fetchMyDonations = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('ログインが必要です');
  }

  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('created_by', user.id);

  if (error) {
    // RLSエラーの可能性を考慮
    if (error.code === 'PGRST301') {
      throw new Error('アクセス権限がありません');
    }
    throw error;
  }

  return data;
};

// 2. リアルタイムサブスクリプション（必要に応じて）
useEffect(() => {
  const subscription = supabase
    .channel('donations')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'donations' },
      (payload) => {
        // 新規寄贈物の通知
        toast.info(`新しい寄贈物「${payload.new.title}」が登録されました`);
        queryClient.invalidateQueries({ queryKey: ['donations'] });
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);

// 3. Storage使用時のパターン
const uploadImage = async (file: File, donationId: string) => {
  // ファイル名にタイムスタンプを付与（重複回避）
  const fileName = `${donationId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('donation-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error('画像のアップロードに失敗しました');
  }

  // 公開URLを取得
  const { data: { publicUrl } } = supabase.storage
    .from('donation-images')
    .getPublicUrl(fileName);

  return publicUrl;
};
```

---

## 📋 コード生成前チェックリスト

新機能を実装する前に、必ず以下を確認：

- [ ] 既存コンポーネント/関数の再利用を検討したか？
- [ ] TypeScriptの型定義を用意したか？
- [ ] Zodスキーマでバリデーションを定義したか？
- [ ] エラーハンドリングを実装したか？
- [ ] ローディング状態を考慮したか？
- [ ] 日本語のエラーメッセージを用意したか？
- [ ] テストファイルを同時に作成するか？
- [ ] アクセシビリティ（aria-label等）を考慮したか？
- [ ] レスポンシブデザインに対応したか？
- [ ] セキュリティ（認証・認可）を確認したか？

---

## 🔄 更新履歴

| 日付 | 内容 | 理由 |
|------|------|------|
| 2025-11-11 | 初版作成 | Claude Code用設定ファイル |

---

**重要**: このファイルの内容はプロジェクトの最優先ルールです。
迷ったらこのファイルの規則に従ってください。

Fun-Circle-TechWave
