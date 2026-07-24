-- 前のマイグレーション(20260719000000)でUPDATEポリシーのWITH CHECKを修正したが、
-- それだけでは削除(論理削除)が完結しないことが検証環境での実機テストで判明した。
--
-- 原因: PostgreSQLのRLSでは、UPDATE文は「UPDATEポリシーのWITH CHECK」に加えて、
--       更新後の行が当該テーブルのSELECTポリシーも満たしている必要がある。
--       donationsのSELECTポリシー"All users can view active donations"は
--       USING (deleted_at IS NULL) のみだったため、deleted_atをセットする
--       論理削除のUPDATEは、更新後の行がこのSELECT条件を満たせず、
--       "new row violates row-level security policy for table donations"
--       というエラーで拒否されていた(WITH CHECKを直しただけでは解決しない)。
--
-- 対応: SELECTポリシーに「自分の寄贈物」「管理者」の場合は削除済みでも
--       見えるようにする条件を追加する。これにより更新後の行もSELECT
--       ポリシーを満たせるようになり、UPDATE(論理削除)が成功する。
--       一覧表示自体はアプリ側のクエリで deleted_at IS NULL を絞り込んで
--       いるため、削除済みデータが一覧に紛れ込むことはない。

DROP POLICY IF EXISTS "All users can view active donations" ON donations;

CREATE POLICY "All users can view active donations" ON donations
    FOR SELECT USING (
        deleted_at IS NULL
        OR auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'system')
        )
    );
