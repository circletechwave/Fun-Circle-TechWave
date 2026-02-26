-- 管理者ユーザー（admin@company.com）再作成用SQL
-- すでに同名のユーザーが存在する場合、削除してから正しいIDで作成し直します。

DO $$
DECLARE
  v_admin_id uuid := '33ceed5e-3dbb-48c1-bc9f-83f4f4d5f79e';
  v_email text := 'admin@company.com';
  v_existing_id uuid;
BEGIN
  -- 1. auth.users の重複チェックと削除
  SELECT id INTO v_existing_id FROM auth.users WHERE email = v_email;
  
  IF v_existing_id IS NOT NULL AND v_existing_id != v_admin_id THEN
    -- IDが異なる同名ユーザーが存在する場合、削除する
    DELETE FROM auth.identities WHERE user_id = v_existing_id;
    DELETE FROM auth.users WHERE id = v_existing_id;
  END IF;

  -- 2. public.users の重複チェックと削除
  SELECT id INTO v_existing_id FROM public.users WHERE email = v_email;
  
  IF v_existing_id IS NOT NULL AND v_existing_id != v_admin_id THEN
    -- IDが異なる同名ユーザーが存在する場合、削除する（依存データがあるとエラーになる可能性があります）
    DELETE FROM public.users WHERE id = v_existing_id;
  END IF;

  -- 3. auth.users に正しいIDで作成（または更新）
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  )
  VALUES (
    v_admin_id,
    v_email,
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"管理者太郎"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;

  -- 4. auth.identities にID情報を追加
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    v_admin_id,
    format('{"sub":"%s","email":"%s"}', v_admin_id, v_email)::jsonb,
    'email',
    now(),
    now(),
    now()
  ) ON CONFLICT (user_id, provider) DO NOTHING;

  -- 5. public.users にも正しいIDで作成（または更新）
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    department,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    v_admin_id,
    v_email,
    '管理者太郎',
    'admin',
    '管理部',
    true,
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    name = '管理者太郎',
    email = 'admin@company.com';

END $$;
