-- パスワード再発行（リセット）機能の監査ログアクションを追加
-- PASSWORD_RESET_REQUEST: パスワード再設定メールの送信をリクエストした時点
-- PASSWORD_RESET_COMPLETE: 新しいパスワードの設定が完了した時点
--
-- 既存のchk_audit_logs_action制約を洗い替える。IF EXISTSにより、
-- 未マージの他PRで先に本制約が更新されていても冪等に適用できる。
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS chk_audit_logs_action;

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
    'PASSWORD_RESET_REQUEST',
    'PASSWORD_RESET_COMPLETE'
));
