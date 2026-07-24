-- 「人気順」ソートを実装する。
-- これまで donationApi.searchDonations() の "popular" ソートは
-- created_at DESC（＝「新しい順」と同一）のプレースホルダーだったため、
-- 累計貸出回数(lendings件数)を基準にした本来の人気順に置き換える。

-- donationsに累計貸出回数を保持する非正規化カラムを追加
ALTER TABLE donations ADD COLUMN lending_count INTEGER NOT NULL DEFAULT 0;

-- 既存データの初期値を実際の貸出件数で補正する
UPDATE donations d
SET lending_count = (
  SELECT count(*) FROM lendings l WHERE l.donation_id = d.id
);

CREATE INDEX idx_donations_lending_count ON donations(lending_count);

-- lendings作成時にdonations.lending_countを自動でインクリメントする
-- SECURITY DEFINERにするのは、一般ユーザーがborrow_donation()経由で
-- 貸出登録した際にも、他人が作成したdonationsの件数を更新できるようにするため
-- (既存のupdate_donation_status_on_lendingと同様のパターン)
CREATE OR REPLACE FUNCTION public.increment_donation_lending_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE donations
  SET lending_count = lending_count + 1
  WHERE id = NEW.donation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_lending_count_on_lending_insert
  AFTER INSERT ON lendings
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_donation_lending_count();
