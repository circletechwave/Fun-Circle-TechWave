-- Storageおよび貸出記録のRLSポリシーを修正し、未ログインユーザーからのアクセスを遮断する
--
-- 【Storage】
-- 20250928055132_create_bucket_policy.sql の "Public Upload" / "Public Update" / "Public Delete" は
-- ロール指定がなく anon（未ログイン）にも適用されていた。RLSポリシーはORで評価されるため、
-- 同ファイルで定義した「認証済みユーザーが自分のフォルダ（{auth.uid()}/）のみ操作可能」という
-- ポリシーが無効化され、誰でも画像のアップロード・上書き・削除ができる状態だった。
-- これらを削除し、認証済みユーザー向けポリシーのみを有効にする。
-- 閲覧（"Public Access" / "Anyone can view images"）は公開バケットのため維持する。
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- クライアント側チェックを迂回したアップロードに備え、バケット側でもサイズと形式を制限する
-- （storageService.ts の MAX_FILE_SIZE = 5MB と揃える）
UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/*']
WHERE id = 'donation-image';

-- 【lendings】
-- 20260624000004_allow_all_users_view_lendings.sql の SELECT ポリシーはロール指定がなく、
-- 未ログインでも全貸出記録（利用目的など）を閲覧できた。対象をログインユーザーに限定する。
DROP POLICY IF EXISTS "All users can view all lendings" ON lendings;

CREATE POLICY "All users can view all lendings" ON lendings
    FOR SELECT
    TO authenticated
    USING (true);
