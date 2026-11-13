-- users / audit_logs のRLSポリシーを修正し、未ログインユーザーからのアクセスを制限する
--
-- 【users】
-- "Users can view all active users" はロール指定がなく、未ログインでも全社員の
-- メールアドレス・氏名・部署・ロールを閲覧できた。対象をログインユーザーに限定する。
-- （フロントで users を参照するのはログイン後のみ）
DROP POLICY IF EXISTS "Users can view all active users" ON users;

CREATE POLICY "Users can view all active users" ON users
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- 【audit_logs】
-- "System can insert audit logs" は WITH CHECK (true) で、未ログインでも任意の内容
-- （他人の user_id や任意の action）を書き込めた。
-- ただしログイン失敗・認証エラー・パスワード再発行リクエストは未ログイン状態で記録する
-- 必要があるため（authLogger.ts）、anon にはそれらのアクションのみ user_id なしで許可する。
-- SECURITY DEFINER 関数からの書き込みはRLSの影響を受けない。
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Anonymous can insert pre-login audit logs" ON audit_logs
    FOR INSERT
    TO anon
    WITH CHECK (
        user_id IS NULL
        AND action IN ('LOGIN_FAILURE', 'AUTH_ERROR', 'PASSWORD_RESET_REQUEST')
    );

-- ログインユーザーは自分の user_id でのみ記録できる
-- （古いセッションが残った状態でのログイン失敗等に備え、未ログイン用アクションも許可する）
CREATE POLICY "Authenticated users can insert own audit logs" ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        OR (
            user_id IS NULL
            AND action IN ('LOGIN_FAILURE', 'AUTH_ERROR', 'PASSWORD_RESET_REQUEST')
        )
    );
