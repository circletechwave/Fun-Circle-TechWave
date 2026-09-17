-- 管理者が管理画面から一般ユーザーをadmin/systemに昇格・降格できるようにする。
--
-- これまでusersテーブルのUPDATEポリシーは"Users can update own profile"
-- (auth.uid() = id、本人の行のみ)しか存在せず、adminであっても他ユーザーの
-- roleを変更する手段が(Supabaseダッシュボードから直接SQLを叩く以外)無かった。
--
-- なお、自己権限昇格を防ぐ20260723000000_prevent_self_role_escalation.sql の
-- BEFORE UPDATEトリガーと組み合わせて使うことを前提としている。このポリシー
-- 単体でも「実行者がadmin/systemであること」をUSING/WITH CHECK双方で
-- 検証しているため、一般ユーザーが他ユーザーのroleを書き換えることはできない。

CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users AS u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'system')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users AS u
            WHERE u.id = auth.uid() AND u.role IN ('admin', 'system')
        )
    );

-- 昇格・降格操作を監査ログに記録できるよう、アクション種別を追加する
ALTER TABLE audit_logs DROP CONSTRAINT chk_audit_logs_action;
ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_logs_action CHECK (action IN (
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'LOGOUT',
    'AUTH_ERROR',
    'PERMISSION_DENIED',
    'DONATION_CREATE',
    'DONATION_UPDATE',
    'DONATION_DELETE',
    'LENDING_CREATE',
    'LENDING_RETURN',
    'API_ERROR',
    'USER_ROLE_UPDATE'
));
