-- 【重大】一般ユーザーが自分自身をadmin/systemに昇格できてしまう脆弱性を修正。
--
-- "Users can update own profile" (FOR UPDATE USING (auth.uid() = id)) には
-- WITH CHECKが指定されておらず、USING句(auth.uid() = id、本人の行かどうか
-- のみ)がそのまま流用される。どのカラムを変更しようとしているかは一切
-- チェックされないため、一般ユーザーが
--   supabase.from('users').update({ role: 'admin' }).eq('id', 自分のid)
-- を実行するだけで自分をadmin/systemに昇格でき、寄贈物削除・タグ/マスタ
-- 管理・監査ログ閲覧など全ての管理者限定機能に自由にアクセスできてしまう。
--
-- RLSのWITH CHECKだけではUPDATE前後の値を比較できないため、
-- BEFORE UPDATEトリガーでroleカラムの変更を検知し、変更しようとしている
-- 本人(auth.uid())が既にadmin/systemロールでない限り拒否する。
-- これにより、将来「adminが他ユーザーのroleを更新できるポリシー」を
-- 追加した場合でも、admin自身による昇格操作は許可されたまま、
-- 一般ユーザーによる自己昇格だけを防げる。

CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'system')
    ) THEN
      RAISE EXCEPTION '権限がないため、ロールを変更できません';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_role_escalation_trigger ON users;
CREATE TRIGGER prevent_self_role_escalation_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();
