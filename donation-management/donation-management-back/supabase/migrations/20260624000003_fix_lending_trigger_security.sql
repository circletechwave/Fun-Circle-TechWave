-- トリガー関数を SECURITY DEFINER に変更
-- 一般ユーザーが貸出・返却処理をした際も donations テーブルを更新できるようにする

-- 既存のトリガー関数を削除して再作成
DROP FUNCTION IF EXISTS update_donation_status_on_lending() CASCADE;

-- SECURITY DEFINER で関数を作成（関数作成者の権限で実行）
CREATE OR REPLACE FUNCTION update_donation_status_on_lending()
RETURNS TRIGGER
SECURITY DEFINER  -- この行が重要！関数作成者（管理者）の権限で実行
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        UPDATE donations SET status = 'lending' WHERE id = NEW.donation_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'returned' THEN
        UPDATE donations SET status = 'available' WHERE id = NEW.donation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを再作成
CREATE TRIGGER update_donation_status
    AFTER INSERT OR UPDATE ON lendings
    FOR EACH ROW
    EXECUTE FUNCTION update_donation_status_on_lending();


-- 同様に、donations → lendings の逆方向トリガーも修正
DROP FUNCTION IF EXISTS sync_lending_status_on_donation_update() CASCADE;

CREATE OR REPLACE FUNCTION sync_lending_status_on_donation_update()
RETURNS TRIGGER
SECURITY DEFINER  -- 管理者権限で実行
SET search_path = public
AS $$
BEGIN
    -- donations.status が 'lending' から別のステータスに変更された場合
    IF OLD.status = 'lending' AND NEW.status != 'lending' THEN
        -- 対応するアクティブな貸出レコードを返却済みに変更
        UPDATE lendings
        SET
            status = 'returned',
            returned_at = CURRENT_TIMESTAMP
        WHERE
            donation_id = NEW.id
            AND status = 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_lending_on_donation_status_change
    AFTER UPDATE ON donations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION sync_lending_status_on_donation_update();
