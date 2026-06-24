-- 全ユーザーが貸出情報を閲覧できるように変更
-- 返却処理は引き続き借りた本人と管理者のみ可能

-- 既存のSELECTポリシーを削除
DROP POLICY IF EXISTS "Users can view own lendings" ON lendings;
DROP POLICY IF EXISTS "Admins can view all lendings" ON lendings;

-- 全ユーザーが全ての貸出情報を閲覧可能にする
-- (誰が何を借りているか、いつ返却予定かを確認できる)
CREATE POLICY "All users can view all lendings" ON lendings
    FOR SELECT USING (true);

-- UPDATEポリシーは既に存在（借りた本人と管理者のみ更新可能）
-- 返却ボタンの表示制御はフロントエンド側で実装済み
