import { z } from 'zod';

/**
 * 寄贈物登録・編集フォームのバリデーションスキーマ
 *
 * Zodを使用してフォーム入力のバリデーションルールを定義します。
 * React Hook Formと統合して使用されます。
 */
export const donationFormSchema = z.object({
  // 基本情報
  title: z.string()
    .min(1, '品名は必須です')
    .max(255, '255文字以内で入力してください'),

  category_id: z.string()
    .uuid('カテゴリを選択してください'),

  sub_category_id: z.string().uuid().optional().or(z.literal('')),

  location_id: z.string()
    .uuid('保管場所を選択してください'),

  status: z.enum(['available', 'lending', 'maintenance', 'lost'], {
    required_error: 'ステータスを選択してください',
  }),

  condition: z.enum(['new', 'good', 'fair', 'poor']).optional().or(z.literal('')),

  description: z.string()
    .max(2000, '2000文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  donor_name: z.string()
    .max(100, '100文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  donated_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が正しくありません（YYYY-MM-DD）'),

  // 画像URL（配列として扱う場合は別途処理が必要）
  image_urls: z.array(z.string().url('有効なURLを入力してください')).optional(),

  // タグ（配列として扱う場合は別途処理が必要）
  tags: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
  })).optional(),

  // 書籍情報
  isbn: z.string()
    .max(20, '20文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  author: z.string()
    .max(200, '200文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  publisher: z.string()
    .max(200, '200文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  published_year: z.number()
    .int('整数を入力してください')
    .min(1000, '1000以上の年を入力してください')
    .max(9999, '9999以下の年を入力してください')
    .optional()
    .or(z.literal(0)), // 0を許容（空欄として扱う）

  // 備品情報
  manufacturer: z.string()
    .max(200, '200文字以内で入力してください')
    .optional()
    .or(z.literal('')),

  model_number: z.string()
    .max(100, '100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
});

/**
 * 寄贈物フォームデータの型定義
 *
 * Zodスキーマから自動的に型を推論します。
 */
export type DonationFormData = z.infer<typeof donationFormSchema>;
