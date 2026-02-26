-- 新規ユーザー登録時の自動同期トリガー
-- auth.users にINSERTされた際、public.users にもレコードを作成します

-- トリガー関数の作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 氏名（name）は raw_user_meta_data から取得
  -- メタデータがない場合はメールアドレスの@前を使用するなどのフォールバックも可能だが、
  -- 今回はフロントエンドで必ず送信することを前提とする
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'No Name'),
    'user', -- デフォルトロール
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
-- すでに存在する場合は削除してから作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
