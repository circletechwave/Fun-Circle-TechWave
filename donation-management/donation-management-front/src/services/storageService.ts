import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'donation-image';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    }
};
