import type { Donation, Category, Location, SearchFilters, PaginationInfo, Tag, Lending } from '../types/donation';

import { supabase } from '../lib/supabase';

interface DonationListResponse {
  success: boolean;
  data: Donation[];
  pagination: PaginationInfo;
  error?: string;
}

interface CategoryListResponse {
  success: boolean;
  data: Category[];
  error?: string;
}

interface LocationListResponse {
  success: boolean;
  data: Location[];
  error?: string;
}

interface TagListResponse {
  success: boolean;
  data: Tag[];
  error?: string;
}

export const donationApi = {
  // ... (searchDonations is unchanged)

  async searchDonations(filters: Partial<SearchFilters>): Promise<DonationListResponse> {
    try {
      let query = supabase
        .from('donations')
        .select(`
          *,
          categories (id, name),
          sub_categories (id, name),
          locations (id, name),
          donation_images (image_url, display_order),
          donation_tags!left (
            tags (id, name)
          )
        `, { count: 'exact' })
        .is('deleted_at', null);

      // Apply filters
      if (filters.tag_id) {
        // Use inner join for tag filtering
        query = query.filter('donation_tags.tag_id', 'eq', filters.tag_id);
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.sub_category_id) {
        query = query.eq('sub_category_id', filters.sub_category_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }
      if (filters.keyword) {
        query = query.or(`title.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,author.ilike.%${filters.keyword}%`);
      }

      // Apply sorting
      const sort = filters.sort || '-created_at';
      const isAsc = !sort.startsWith('-');
      const column = sort.replace('-', '');

      if (column === 'popular') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order(column, { ascending: isAsc });
      }

      // Apply pagination
      const page = filters.page || 1;
      const per_page = filters.per_page || 20;
      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      // Transform data to match Donation interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const donations: Donation[] = (data || []).map((item: any) => ({
        ...item,
        category: item.categories,
        sub_category: item.sub_categories,
        location: item.locations,
        // Ensure arrays are initialized if null
        image_urls: item.donation_images?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order).map((img: { image_url: string }) => img.image_url) || [],
        tags: item.donation_tags?.map((dt: { tags: Tag }) => dt.tags).filter(Boolean) || [],
      }));

      const total = count || 0;
      const total_pages = Math.ceil(total / per_page);

      return {
        success: true,
        data: donations,
        pagination: {
          page,
          per_page,
          total,
          total_pages,
        },
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
        error: error instanceof Error ? error.message : '検索に失敗しました',
      };
    }
  },

  async getDonation(id: string): Promise<{ success: boolean; data: Donation; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select(`
          *,
          categories (id, name),
          sub_categories (id, name),
          locations (id, name),
          donation_images (image_url, display_order),
          donation_tags (tags (id, name))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item: any = data; // Keep as any for now due to complex nested structure
      const donation: Donation = {
        ...item,
        category: item.categories,
        sub_category: item.sub_categories,
        location: item.locations,
        image_urls: item.donation_images?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order).map((img: { image_url: string }) => img.image_url) || [],
        tags: item.donation_tags?.map((dt: { tags: Tag }) => dt.tags) || [],
      };

      return { success: true, data: donation };
    } catch (error) {
      return {
        success: false,
        data: {} as Donation,
        error: error instanceof Error ? error.message : '取得に失敗しました'
      };
    }
  },

  async createDonation(donation: Partial<Donation>): Promise<{ success: boolean; data: Donation; error?: string }> {
    // List of actual table columns to include in insert/update
    const donationColumns = [
      'title', 'category_id', 'sub_category_id', 'donor_name', 'donated_date',
      'location_id', 'status', 'description', 'isbn', 'author', 'publisher',
      'published_year', 'manufacturer', 'model_number', 'condition',
      'created_by', 'updated_by'
    ];

    try {
      // Pick only whitelisted columns from the input
      const insertData: Record<string, unknown> = {};
      donationColumns.forEach(key => {
        if (donation[key as keyof Partial<Donation>] !== undefined) {
          const value = donation[key as keyof Partial<Donation>];
          // Convert empty strings to null for optional foreign key fields
          if ((key === 'sub_category_id') && value === '') {
            insertData[key] = null;
          } else {
            insertData[key] = value;
          }
        }
      });
      // eslint-disable-next-line no-console
      console.debug('Inserting donation with whitelisted data:', insertData);

      // Add created_by if missing — use getSession() (cached, no network) for reliability
      if (!insertData.created_by) {
        const { data: { session } } = await supabase.auth.getSession();
        insertData.created_by = session?.user?.id;
        if (!insertData.created_by) {
          throw new Error('ログインユーザーが取得できませんでした。再ログインしてください。');
        }
      }

      const { data, error } = await supabase
        .from('donations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase Insert Error:', error);
        throw error;
      }

      const newDonationId = data.id;

      // Extract image_urls and tags from the original donation object
      const image_urls = donation.image_urls;
      const tags = donation.tags;

      // Insert images
      if (image_urls && image_urls.length > 0) {
        const imagesToInsert = image_urls.map((url: string, index: number) => ({
          donation_id: newDonationId,
          image_url: url,
          display_order: index + 1
        }));
        const { error: imgError } = await supabase.from('donation_images').insert(imagesToInsert);
        if (imgError) throw imgError;
      }

      // Insert tags
      if (tags && tags.length > 0) {
        // tags can be array of strings (IDs) or Tag objects
        // Deduplicate tags to avoid 409 Conflict on unique constraint
        const tagIds: string[] = Array.from(new Set(tags.map(t => typeof t === 'string' ? t : t.id)));
        // eslint-disable-next-line no-console
        console.debug(`Inserting ${tagIds.length} unique tags for donation ${newDonationId}:`, tagIds);
        const tagsToInsert = tagIds.map((tagId: string) => ({
          donation_id: newDonationId,
          tag_id: tagId
        }));
        const { error: tagError } = await supabase.from('donation_tags').insert(tagsToInsert);
        if (tagError) throw tagError;
      }

      return { success: true, data };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Full Create Error Object:', error);
      return {
        success: false,
        data: {} as Donation,
        error: error.message || '登録に失敗しました'
      };
    }
  },

  async updateDonation(id: string, donation: Partial<Donation>): Promise<{ success: boolean; data: Donation; error?: string }> {
    try {
      // リレーションデータや読み取り専用フィールドを除外
      const donationWithMeta = donation as Partial<Donation> & { created_by?: string; deleted_at?: string; avg_rating?: number; review_count?: number };
      const {
        category, sub_category, location,
        id: _id, created_at, updated_at, created_by,
        image_urls, tags, avg_rating, review_count,
        image_url,
        deleted_at,
        ...updateData
      } = donationWithMeta;

      // Convert empty strings to null for optional foreign key fields
      if (updateData.sub_category_id === '') {
        (updateData as { sub_category_id?: string | null }).sub_category_id = null;
      }

      // eslint-disable-next-line no-console
      console.debug('Updating donation with filtered data:', updateData);

      const { data, error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase Update Error:', error);
        throw error;
      }

      // Update images (Delete all and insert new)
      if (image_urls !== undefined) {
        // eslint-disable-next-line no-console
        console.debug(`Updating images for donation ${id}. Deleting existing...`);
        await supabase.from('donation_images').delete().eq('donation_id', id);
        if (image_urls.length > 0) {
          // eslint-disable-next-line no-console
          console.debug(`Inserting ${image_urls.length} new images for donation ${id}`);
          const imagesToInsert = image_urls.map((url: string, index: number) => ({
            donation_id: id,
            image_url: url,
            display_order: index + 1
          }));
          await supabase.from('donation_images').insert(imagesToInsert);
        } else {
          // eslint-disable-next-line no-console
          console.debug(`No images provided for donation ${id}, all existing images deleted.`);
        }
      }

      // Update tags (delete and re-insert)
      if (tags !== undefined) {
        // eslint-disable-next-line no-console
        console.debug(`Updating tags for donation ${id}. Deleting existing...`);
        await supabase.from('donation_tags').delete().eq('donation_id', id);
        if (tags.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tagIds: string[] = Array.from(new Set(tags.map((t: any) => typeof t === 'string' ? t : t.id)));
          // eslint-disable-next-line no-console
          console.debug(`Inserting ${tagIds.length} unique tags for donation ${id}:`, tagIds);
          const tagsToInsert = tagIds.map((tagId: string) => ({
            donation_id: id,
            tag_id: tagId
          }));
          const { error: tagError } = await supabase.from('donation_tags').insert(tagsToInsert);
          if (tagError) throw tagError;
        } else {
          // eslint-disable-next-line no-console
          console.debug(`No tags provided for donation ${id}, all existing tags deleted.`);
        }
      }
      return { success: true, data };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Full Update Error Object:', error);
      return {
        success: false,
        data: {} as Donation,
        error: error.message || '更新に失敗しました'
      };
    }
  },

  async deleteDonation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('donations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select('id');

      if (error) throw error;

      // RLSにより対象行が0件だった場合、エラーは発生せず空配列が返るため
      // 明示的にチェックしないと削除が成功したように見えてしまう
      if (!data || data.length === 0) {
        return { success: false, error: '削除する権限がないか、対象の寄贈物が見つかりませんでした' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '削除に失敗しました' };
    }
  },

  async getCategories(): Promise<CategoryListResponse> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, sub_categories(*)')
        .order('display_order');

      if (error) throw error;
      return { success: true, data: data as Category[] };
    } catch (error) {
      return { success: false, data: [], error: error instanceof Error ? error.message : 'カテゴリの取得に失敗しました' };
    }
  },

  async getLocations(): Promise<LocationListResponse> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) throw error;
      return { success: true, data: data as Location[] };
    } catch (error) {
      return { success: false, data: [], error: error instanceof Error ? error.message : '保管場所の取得に失敗しました' };
    }
  },

  async getTags(): Promise<TagListResponse> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      return { success: true, data: data as Tag[] };
    } catch (error) {
      return { success: false, data: [], error: error instanceof Error ? error.message : 'タグの取得に失敗しました' };
    }
  },

  async getActiveLending(donationId: string): Promise<{ success: boolean; data: Lending | null; error?: string }> {
    try {
      // 稀に残る重複activeレコード（過去の競合発生分など）があっても
      // maybeSingle()が「複数行該当」エラーにならないよう、最新の1件に絞る
      const { data, error } = await supabase
        .from('lendings')
        .select(`
          *,
          users!fk_lendings_user (id, name, email)
        `)
        .eq('donation_id', donationId)
        .eq('status', 'active')
        .order('borrowed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // データが存在しない場合
      if (!data) {
        return { success: true, data: null };
      }

      // Supabaseの返り値をLending型に変換
      const lending: Lending = {
        ...data,
        users: data.users
      };

      return { success: true, data: lending };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '貸出情報の取得に失敗しました'
      };
    }
  },


  async borrowDonation(donationId: string, dueDate: string, purpose?: string): Promise<{ success: boolean; data: Lending | null; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('ログインユーザーの取得に失敗しました。再ログインしてください。');
      }

      // ステータス確認とlendings作成をDB側の1トランザクション・行ロックで行うことで、
      // 複数ユーザーが同時に「借りる」を押した場合の二重貸出を防ぐ
      // （donations.statusへの反映は既存のトリガーが自動的に行う）
      const { data, error } = await supabase
        .rpc('borrow_donation', {
          p_donation_id: donationId,
          p_due_date: dueDate,
          p_purpose: purpose || null
        });

      if (error) {
        // 万一RPCを介さずにINSERTが競合した場合の保険（ユニーク制約違反）
        if (error.code === '23505') {
          return { success: false, data: null, error: 'この品は現在貸出中です' };
        }
        // instanceof Errorの判定に依存せず、プロパティを直接参照する
        return { success: false, data: null, error: error.message || '貸出処理に失敗しました' };
      }

      return { success: true, data: data as Lending };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '貸出処理に失敗しました'
      };
    }
  },

  async returnDonation(lendingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // 貸出レコードのステータスを返却済みに更新
      // トリガー update_donation_status_on_lending が自動的に donations.status を 'available' に更新する
      const { error: lendingError } = await supabase
        .from('lendings')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString()
        })
        .eq('id', lendingId);

      if (lendingError) throw lendingError;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '返却処理に失敗しました'
      };
    }
  },
};