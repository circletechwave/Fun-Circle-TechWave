-- タイトルの昇順・降順ソートで日本語（特に漢字）の並び順が期待と異なる不具合を修正。
-- donations.titleにCOLLATE指定がなく、DBのデフォルトロケール(en_US.UTF-8相当)で
-- ORDER BYされていたため、Unicodeコードポイント順に近い並びになっていた。
-- ICUの日本語コレーションを列に設定し、より自然な日本語の並び順にする。
--
-- 注意: ICUの"ja"コレーションは辞書式順序の近似であり、同じ漢字でも文脈により
-- 読みが異なるケースまでは完全に反映できない(真の五十音順には読み仮名カラムが必要)。
-- それでも現状のUnicodeコードポイント順よりは大幅に自然な並びになる。

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_collation WHERE collname = 'ja-x-icu') THEN
    CREATE COLLATION "ja-x-icu" (provider = icu, locale = 'ja');
  END IF;
END $$;

ALTER TABLE donations
  ALTER COLUMN title TYPE VARCHAR(255) COLLATE "ja-x-icu";
