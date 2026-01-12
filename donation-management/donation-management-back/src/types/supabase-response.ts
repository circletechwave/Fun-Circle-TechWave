/**
 * Supabaseレスポンスの型定義（バックエンド）
 *
 * Supabaseからのレスポンスは、リレーション情報が特定の構造で返ってくるため、
 * any型を使わずに適切な型定義を行います。
 */

/**
 * 寄贈物一覧取得時のSupabaseレスポンス型
 */
export interface DonationListRow {
  id: string;
  title: string;
  status: 'available' | 'lending' | 'maintenance' | 'lost';
  donor_name?: string | null;
  donated_date: string;
  categories: {
    id: string;
    name: string;
  };
  sub_categories?: {
    id: string;
    name: string;
  } | null;
  locations: {
    id: string;
    name: string;
  };
}

/**
 * 寄贈物詳細取得時のSupabaseレスポンス型
 */
export interface DonationDetailRow {
  id: string;
  title: string;
  status: 'available' | 'lending' | 'maintenance' | 'lost';
  category_id: string;
  sub_category_id?: string | null;
  location_id: string;
  description?: string | null;
  condition?: 'new' | 'good' | 'fair' | 'poor' | null;
  isbn?: string | null;
  author?: string | null;
  publisher?: string | null;
  published_year?: number | null;
  manufacturer?: string | null;
  model_number?: string | null;
  donor_name?: string | null;
  donated_date: string;
  created_at: string;
  updated_at: string;

  // リレーション
  categories: {
    id: string;
    name: string;
  };
  sub_categories?: {
    id: string;
    name: string;
  } | null;
  locations: {
    id: string;
    name: string;
  };
  donation_images: Array<{
    id: string;
    image_url: string;
    display_order: number;
  }>;
  donation_tags: Array<{
    tag_id: string;
    tags: {
      id: string;
      name: string;
    };
  }>;
}

/**
 * 画像情報の型定義
 */
export interface DonationImage {
  id: string;
  donation_id: string;
  image_url: string;
  display_order: number;
}

/**
 * タグ情報の型定義
 */
export interface Tag {
  id: string;
  name: string;
}

/**
 * 寄贈物とタグの関連の型定義
 */
export interface DonationTag {
  donation_id: string;
  tag_id: string;
  tags: Tag;
}
