-- lendingsテーブルにUPDATEポリシーを追加
-- 返却処理を可能にするため、借りた本人と管理者が更新できるようにする

-- ユーザーは自分の貸出レコードを更新可能（返却処理など）
CREATE POLICY "Users can update own lendings" ON lendings
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 管理者は全ての貸出レコードを更新可能
CREATE POLICY "Admins can update all lendings" ON lendings
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
