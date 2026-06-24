-- 管理者が全ての寄贈物を更新できるようにする
-- 既存の "Donors and admins can update donations" ポリシーが存在しない、
-- または WITH CHECK 句が欠けている場合のために明示的に追加

-- 既存のポリシーを確認して削除（存在する場合）
DROP POLICY IF EXISTS "Donors and admins can update donations" ON donations;
DROP POLICY IF EXISTS "Admins can update all donations" ON donations;

-- 管理者用のUPDATEポリシーを作成
CREATE POLICY "Admins can update all donations" ON donations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    );
