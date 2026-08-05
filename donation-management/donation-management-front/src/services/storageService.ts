import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'donation-image';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 公開URLからStorage上のファイルパスを抽出する
 * @param url 公開URL（例: https://xxx.supabase.co/storage/v1/object/public/donation-image/xxx.jpg）
 * @returns バケット内のファイルパス。バケット外のURL等、抽出できない場合はnull
 */
const extractStoragePath = (url: string): string | null => {
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const index = url.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(url.slice(index + marker.length));
};

export const storageService = {
    /**
     * 画像をSupabase Storageにアップロードし、公開URLを返す
     * @param file アップロードするファイル
     * @returns 公開URL
     */
    async uploadImage(file: File): Promise<string> {
        // ファイルサイズのチェック
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('ファイルサイズは5MB以下にしてください。');
        }

        // ファイル形式のチェック
        if (!file.type.startsWith('image/')) {
            throw new Error('画像ファイルのみアップロード可能です。');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error details:', uploadError);
            throw new Error('画像のアップロードに失敗しました。');
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        return publicUrl;
    },

    /**
     * ストレージ内の画像一覧を取得する
     */
    async listImages(): Promise<string[]> {
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) {
            console.error('List images error:', error);
            return [];
        }

        // 公開URLに変換
        return data.map(file => {
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(file.name);
            return publicUrl;
        });
    },

    /**
     * 指定した公開URLの画像をSupabase Storageから削除する
     * バケット外のURL（外部URL等）はスキップする
     * @param urls 削除対象の公開URLの配列
     */
    async deleteImages(urls: string[]): Promise<void> {
        const paths = urls
            .map(extractStoragePath)
            .filter((path): path is string => path !== null);

        if (paths.length === 0) return;

        const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);

        if (error) {
            console.error('Delete image(s) error:', error);
            throw new Error('画像の削除に失敗しました。');
        }
    }
};
