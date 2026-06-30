-- donations テーブルのステータス変更時に lendings テーブルも連動させる
-- 管理者が編集フォームでステータスを変更した際にデータ整合性を保つ

CREATE OR REPLACE FUNCTION sync_lending_status_on_donation_update()
RETURNS TRIGGER AS $$
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

-- トリガーを作成
CREATE TRIGGER sync_lending_on_donation_status_change
    AFTER UPDATE ON donations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION sync_lending_status_on_donation_update();
