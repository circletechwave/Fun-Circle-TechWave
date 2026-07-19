-- 管理者が保管場所(locations)・サブカテゴリ(sub_categories)を
-- 追加・削除できるようにする。
--
-- categoriesには既に"Admins can manage categories"(FOR ALL)ポリシーが
-- 存在し追加・削除が可能だったが、locations/sub_categoriesにはSELECT
-- ポリシーしか無く、adminであっても追加・削除ができない状態だった。
--
-- 使用中(donationsから参照されている)マスタの削除については、既存のFK制約
-- (ON DELETE指定なし=RESTRICT相当)をそのまま利用し、削除を拒否して
-- アプリ側でエラーメッセージを表示する方針とする(tagsと同様)。
-- カテゴリに子sub_categoriesが存在する場合も、既存のFK制約
-- (sub_categories.category_id、ON DELETE指定なし)により同様に拒否される。

CREATE POLICY "Admins can insert locations" ON locations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    );

CREATE POLICY "Admins can delete locations" ON locations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    );

CREATE POLICY "Admins can insert sub_categories" ON sub_categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    );

CREATE POLICY "Admins can delete sub_categories" ON sub_categories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    );
