-- 一般ユーザーが自分の寄贈物を削除（論理削除）できない不具合を修正
-- 原因: "Users can update own donations" (20260321000000) は USING 句のみを定義しており、
--       WITH CHECK が省略された場合 Postgres は USING 句を更新後の行にも適用する。
--       そのため deleted_at IS NULL という条件が、削除操作で deleted_at を
--       セットした後の行に対しても課され、RLS 違反で更新が拒否されていた。
-- 対応: 対象行の選定は USING (自分の寄贈物かつ未削除) のまま、
--       更新後チェックは WITH CHECK (自分の寄贈物であること) のみとし、
--       deleted_at を NULL 以外に変更できるようにする。

DROP POLICY IF EXISTS "Users can update own donations" ON donations;

CREATE POLICY "Users can update own donations" ON donations
    FOR UPDATE USING (
        auth.uid() = created_by AND deleted_at IS NULL
    )
    WITH CHECK (
        auth.uid() = created_by
    );
