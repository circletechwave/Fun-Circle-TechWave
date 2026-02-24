-- 監査ログテーブル作成
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_path VARCHAR(255),
    request_method VARCHAR(10),
    response_status INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_audit_logs_action CHECK (action IN (
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
        'API_ERROR'
    ))
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS有効化（管理者のみ閲覧可能）
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'system')
        )
    );

-- システムによる挿入を許可
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 90日後のログ自動削除関数
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- 監査ログ記録用トリガー関数
CREATE OR REPLACE FUNCTION log_donation_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    action_type VARCHAR(50);
    user_email_val VARCHAR(255);
BEGIN
    -- ユーザーのメールアドレスを取得
    SELECT email INTO user_email_val
    FROM auth.users
    WHERE id = auth.uid();

    -- アクションタイプを決定
    IF (TG_OP = 'INSERT') THEN
        action_type := 'DONATION_CREATE';
    ELSIF (TG_OP = 'UPDATE') THEN
        -- 論理削除の場合
        IF (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
            action_type := 'DONATION_DELETE';
        ELSE
            action_type := 'DONATION_UPDATE';
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        action_type := 'DONATION_DELETE';
    END IF;

    -- 監査ログに記録
    INSERT INTO audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        user_email_val,
        action_type,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN
            jsonb_build_object(
                'title', OLD.title,
                'status', OLD.status,
                'category_id', OLD.category_id,
                'location_id', OLD.location_id
            )
        ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN
            jsonb_build_object(
                'title', NEW.title,
                'status', NEW.status,
                'category_id', NEW.category_id,
                'location_id', NEW.location_id
            )
        ELSE NULL END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- donationsテーブルにトリガーを設定
DROP TRIGGER IF EXISTS audit_donations_changes ON donations;
CREATE TRIGGER audit_donations_changes
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION log_donation_changes();

-- 定期実行用の設定（pg_cron拡張が必要）
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('delete-old-audit-logs', '0 2 * * *', 'SELECT delete_old_audit_logs()');

COMMENT ON TABLE audit_logs IS '監査ログテーブル - CRUD操作とセキュリティイベントを記録';
COMMENT ON FUNCTION delete_old_audit_logs() IS '90日以上前の監査ログを削除';
COMMENT ON FUNCTION log_donation_changes() IS 'donationsテーブルの変更を監査ログに記録';
