-- 監査ログテーブル作成
-- 目的: アプリケーションログとセキュリティ監視の記録

CREATE TABLE audit_logs (
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

-- コメント
COMMENT ON TABLE audit_logs IS '監査ログ: アプリケーション操作とセキュリティイベントの記録';
COMMENT ON COLUMN audit_logs.action IS 'ログの種類（LOGIN_SUCCESS, DONATION_CREATE等）';
COMMENT ON COLUMN audit_logs.old_values IS '変更前の値（UPDATE/DELETE時）';
COMMENT ON COLUMN audit_logs.new_values IS '変更後の値（CREATE/UPDATE時）';

-- インデックス
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_created_at_action ON audit_logs(created_at DESC, action);

-- RLS有効化
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 管理者のみ閲覧可能
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'system')
            AND users.deleted_at IS NULL
        )
    );

-- RLSポリシー: システム（バックエンド）からの挿入を許可
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- 90日経過したログを削除する関数
CREATE OR REPLACE FUNCTION delete_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_old_audit_logs IS '90日以上経過した監査ログを削除（定期実行用）';
