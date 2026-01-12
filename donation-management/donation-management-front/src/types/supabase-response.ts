/**
 * Supabaseレスポンスの型定義
 *
 * Supabaseからのレスポンスは、リレーション情報が特定の構造で返ってくるため、
 * any型を使わずに適切な型定義を行います。
 */

import type { Donation, Tag } from './donation';

/**
 * Supabaseのリレーション取得時のレスポンス型
 *
 * Supabaseの.select()で関連テーブルを取得した際の構造を定義
 */
export interface DonationWithRelations {
  id: string;
  title: string;
  status: 'available' | 'lending' | 'maintenance' | 'lost';
  category_id: string;
  sub_category_id?: string | null;
  location_id: string;
  description?: string | null;
  donor_name?: string | null;
  donated_date: string;
  condition?: 'new' | 'good' | 'fair' | 'poor' | null;
  isbn?: string | null;
  author?: string | null;
  publisher?: string | null;
  published_year?: number | null;
  manufacturer?: string | null;
  model_number?: string | null;
  image_url?: string | null;
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
  donation_images?: Array<{
    image_url: string;
    display_order: number;
  }>;
  donation_tags?: Array<{
    tags: {
      id: string;
      name: string;
    };
  }>;
}

/**
 * DonationWithRelationsをDonation型に変換するヘルパー関数
 *
 * Supabaseのレスポンスを、フロントエンドで使用するDonation型に変換します。
 *
 * @param raw - Supabaseからのレスポンス
 * @returns Donation型のオブジェクト
 */
export function transformDonationResponse(raw: DonationWithRelations): Donation {
  return {
    id: raw.id,
    title: raw.title,
    category_id: raw.category_id,
    sub_category_id: raw.sub_category_id || undefined,
    location_id: raw.location_id,
    status: raw.status,
    condition: raw.condition || undefined,
    description: raw.description || undefined,
    donor_name: raw.donor_name || undefined,
    donated_date: raw.donated_date,
    image_url: raw.image_url || undefined,
    isbn: raw.isbn || undefined,
    author: raw.author || undefined,
    publisher: raw.publisher || undefined,
    published_year: raw.published_year || undefined,
    manufacturer: raw.manufacturer || undefined,
    model_number: raw.model_number || undefined,
    created_at: raw.created_at,
    updated_at: raw.updated_at,

    // ネストされたオブジェクトに変換
    category: {
      id: raw.categories.id,
      name: raw.categories.name,
    },
    sub_category: raw.sub_categories ? {
      id: raw.sub_categories.id,
      name: raw.sub_categories.name,
    } : undefined,
    location: {
      id: raw.locations.id,
      name: raw.locations.name,
    },

    // 画像URLの配列を作成（display_orderでソート）
    image_urls: raw.donation_images
      ?.sort((a, b) => a.display_order - b.display_order)
      .map(img => img.image_url) || [],

    // タグの配列を作成
    tags: raw.donation_tags?.map(dt => dt.tags) || [],
  };
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
 * タグとの関連の型定義
 */
export interface DonationTag {
  donation_id: string;
  tag_id: string;
  tags: Tag;
}
