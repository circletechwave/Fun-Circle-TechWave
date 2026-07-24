-- 同一donationに対して複数ユーザーがほぼ同時に「借りる」操作を行うと、
-- ステータス確認(donations.status = 'available')とlendings作成(INSERT)が
-- アトミックでないため、両方のINSERTが成功し同一donationに複数のactiveな
-- lendingsが作られてしまう不具合を修正する。
--
-- 結果として getActiveLending() の .maybeSingle() が
-- 「複数行該当」エラーを返し、フロントには「貸出情報が見つかりません」という
-- 誤解を招くメッセージが表示されていた。

-- =================================================
-- 1. 既存の重複データがあれば、最新の1件だけをactiveとして残す
--    （他は cancelled にする。実利用データが壊れていた場合の救済措置）
-- =================================================
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY donation_id
           ORDER BY borrowed_at DESC, id DESC
         ) AS rn
  FROM lendings
  WHERE status = 'active'
)
UPDATE lendings
SET status = 'cancelled'
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- =================================================
-- 2. donation_idごとにactiveなlendingsを1件までに制限する部分ユニークインデックス
--    (最終防衛ライン。どの経路でINSERTされても二重貸出を防ぐ)
-- =================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_lendings_one_active_per_donation
  ON lendings (donation_id)
  WHERE status = 'active';

-- =================================================
-- 3. ステータス確認とlendings作成を1トランザクション・行ロックで行うRPC関数
--    donationsの行をFOR UPDATEでロックすることで、同時リクエストを直列化し、
--    後から来たリクエストは「この品は現在貸出中です」という明確なエラーになる
--    SECURITY DEFINERで実行するため、RLSの影響を受けずに内部処理が完結する
-- =================================================
CREATE OR REPLACE FUNCTION public.borrow_donation(
  p_donation_id uuid,
  p_due_date date,
  p_purpose text
)
RETURNS lendings
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_status varchar(20);
  v_lending lendings;
BEGIN
  -- donation行をロックし、同時アクセスを直列化する
  SELECT status INTO v_status
  FROM donations
  WHERE id = p_donation_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '寄贈物が見つかりません';
  END IF;

  IF v_status != 'available' THEN
    RAISE EXCEPTION 'この品は現在貸出中です';
  END IF;

  INSERT INTO lendings (donation_id, user_id, due_date, purpose, status)
  VALUES (p_donation_id, auth.uid(), p_due_date, p_purpose, 'active')
  RETURNING * INTO v_lending;

  -- donations.status への反映は既存のトリガー update_donation_status_on_lending が行う

  RETURN v_lending;
END;
$$;

GRANT EXECUTE ON FUNCTION public.borrow_donation(uuid, date, text) TO authenticated;
