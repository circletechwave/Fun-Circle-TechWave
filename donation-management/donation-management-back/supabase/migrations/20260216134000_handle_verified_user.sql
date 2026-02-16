-- ユーザー認証後（メール確認完了時）の自動同期トリガー
-- auth.users の email_confirmed_at が更新されたタイミングで public.users にレコードを作成します

-- 旧トリガーと関数の削除（存在する場合）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 新しいトリガー関数の作成
CREATE OR REPLACE FUNCTION public.handle_verified_user()
RETURNS TRIGGER AS $$
BEGIN
  -- メール確認が完了したタイミング（NULL -> 日時）でのみ実行
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- public.users に既に存在しない場合のみ挿入
    INSERT INTO public.users (id, email, name, role, is_active)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'No Name'),
      'user', -- デフォルトロール
      true
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新しいトリガーの作成
DROP TRIGGER IF EXISTS on_auth_user_verified ON auth.users;

CREATE TRIGGER on_auth_user_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_verified_user();
