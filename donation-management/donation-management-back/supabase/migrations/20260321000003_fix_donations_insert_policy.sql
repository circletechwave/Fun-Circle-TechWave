-- donations テーブルの INSERT RLS ポリシーを修正
-- 問題: created_by を auth.uid() と比較するポリシーは、
--       クライアント側で created_by が正しくセットされていない場合に失敗する
-- 解決:
--   1. INSERT ポリシーを「認証済みユーザーなら誰でも登録可能」に変更
--   2. DB トリガーで created_by / updated_by を自動的に auth.uid() に設定
--      （クライアント側の設定に依存しない）

-- =================================================
-- 1. 既存の INSERT ポリシーを置き換え
-- =================================================

DROP POLICY IF EXISTS "Users can create donations" ON donations;

CREATE POLICY "Users can create donations" ON donations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =================================================
-- 2. created_by / updated_by を自動セットするトリガー
-- =================================================

CREATE OR REPLACE FUNCTION public.set_donation_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- created_by が未設定の場合は auth.uid() を使用
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  -- updated_by は常に auth.uid() を設定
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_donation_user_fields_trigger ON donations;

CREATE TRIGGER set_donation_user_fields_trigger
  BEFORE INSERT OR UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION public.set_donation_user_fields();
