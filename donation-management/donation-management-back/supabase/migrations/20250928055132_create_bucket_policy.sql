-- ============================================
-- Supabase Storage ポリシー設定
-- donation-image バケット用
-- ============================================

-- 【ポリシー1】認証済みユーザーは画像をアップロード可能
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'donation-image' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 【ポリシー2】誰でも画像を閲覧可能（公開バケット）
CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'donation-image');

-- 【ポリシー3】アップロードしたユーザーまたは管理者が削除可能
CREATE POLICY "Users can delete own images or admins can delete any"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'donation-image' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'system')
    )
  )
);

-- 【ポリシー4】アップロードしたユーザーまたは管理者が更新可能
CREATE POLICY "Users can update own images or admins can update any"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'donation-image' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'system')
    )
  )
);

-- 1. バケットを「公開(Public)」に設定する（すでにある場合は更新）
INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-image', 'donation-image', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. 画像の閲覧権限をすべての人に許可する
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'donation-image');

-- 3. 画像のアップロード権限をすべての人に許可する
-- (認証済みユーザーのみに制限したい場合は USING (auth.role() = 'authenticated') を使用します)
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'donation-image');

-- 4. 画像の更新・削除権限も許可する
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'donation-image');

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'donation-image');