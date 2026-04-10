-- auth.users → public.users 同期の修正
-- 問題: on_auth_user_verified は AFTER UPDATE のみ監視しているため、
--       サインアップ時に email_confirmed_at が既に設定されている場合（OTP確認後の初回セッション取得など）
--       INSERT イベントでは public.users にレコードが作成されない可能性がある。
-- 解決:
--   1. INSERT トリガーを追加（email_confirmed_at が NULL でない場合に public.users へ挿入）
--   2. 既存の auth.users のうち public.users に存在しないレコードをバックフィル

-- =================================================
-- 1. INSERT トリガー関数の作成
-- =================================================

CREATE OR REPLACE FUNCTION public.handle_new_confirmed_user()
RETURNS TRIGGER AS $$
BEGIN
  -- サインアップ時点で email_confirmed_at が設定済みの場合のみ実行
  IF NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.users (id, email, name, role, is_active)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'No Name'),
      'user',
      true
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INSERT トリガーの登録
DROP TRIGGER IF EXISTS on_auth_user_created_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_created_confirmed
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_confirmed_user();

-- =================================================
-- 2. 既存ユーザーのバックフィル
--    auth.users に存在するが public.users に存在しないレコードを補完
-- =================================================

INSERT INTO public.users (id, email, name, role, is_active)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'No Name'),
  'user',
  true
FROM auth.users au
WHERE au.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
  );
