-- 管理者がタグ(tags)を追加・削除できるようにする。
-- これまでtagsにはSELECTポリシーしか無く(INSERT/DELETEポリシーが無い)、
-- RLS有効時はポリシーが存在しない操作はデフォルトで拒否されるため、
-- adminであってもタグの追加・削除が一切できなかった。
--
-- 使用中のタグ(donation_tagsに紐付いているもの)の削除については、
-- 既存のFK制約(fk_donation_tags_tag、ON DELETE指定なし=RESTRICT相当)を
-- そのまま利用し、削除を拒否してアプリ側でエラーメッセージを表示する方針とする。

CREATE POLICY "Admins can insert tags" ON tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    );

CREATE POLICY "Admins can delete tags" ON tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    );
