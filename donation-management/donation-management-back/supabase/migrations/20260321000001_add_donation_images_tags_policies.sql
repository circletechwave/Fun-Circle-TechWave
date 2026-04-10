-- donation_images と donation_tags テーブルの RLS ポリシーを追加
-- これらのテーブルは RLS が有効だがポリシーが未定義のため、
-- 全操作が拒否されていた（登録失敗・画像/タグ非表示の原因）

-- =================================================
-- donation_images ポリシー
-- =================================================

-- 全ユーザーが画像を閲覧可能
CREATE POLICY "All users can view donation images" ON donation_images
  FOR SELECT USING (true);

-- 登録者本人またはadminが画像を追加可能
CREATE POLICY "Users can insert images for their donations" ON donation_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM donations
      WHERE donations.id = donation_id
        AND donations.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'system')
    )
  );

-- 登録者本人またはadminが画像を削除可能（更新時の一括削除に必要）
CREATE POLICY "Users can delete images of their donations" ON donation_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM donations
      WHERE donations.id = donation_id
        AND donations.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'system')
    )
  );

-- =================================================
-- donation_tags ポリシー
-- =================================================

-- 全ユーザーがタグ紐付けを閲覧可能
CREATE POLICY "All users can view donation tags" ON donation_tags
  FOR SELECT USING (true);

-- 登録者本人またはadminがタグを追加可能
CREATE POLICY "Users can insert tags for their donations" ON donation_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM donations
      WHERE donations.id = donation_id
        AND donations.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'system')
    )
  );

-- 登録者本人またはadminがタグを削除可能（更新時の一括削除に必要）
CREATE POLICY "Users can delete tags of their donations" ON donation_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM donations
      WHERE donations.id = donation_id
        AND donations.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'system')
    )
  );
