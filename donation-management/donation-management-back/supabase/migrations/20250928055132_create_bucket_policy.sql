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