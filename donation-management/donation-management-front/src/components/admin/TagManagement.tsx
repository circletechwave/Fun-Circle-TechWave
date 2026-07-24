import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { donationApi } from '../../services/donationApi';
import type { Tag } from '../../types/donation';

/**
 * タグ管理コンポーネント（管理者のみ追加・削除可能）
 */
export function TagManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await donationApi.getTags();
    if (result.success) {
      setTags(result.data);
    } else {
      setError(result.error || 'タグの取得に失敗しました');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async () => {
    const name = newTagName.trim();
    if (!name) {
      alert('タグ名を入力してください');
      return;
    }

    setActionLoading(true);
    const result = await adminApi.createTag(name);
    setActionLoading(false);

    if (result.success) {
      setNewTagName('');
      await fetchTags();
    } else {
      alert(result.error || 'タグの作成に失敗しました');
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`タグ「${tag.name}」を削除しますか？`)) return;

    setActionLoading(true);
    const result = await adminApi.deleteTag(tag.id);
    setActionLoading(false);

    if (result.success) {
      await fetchTags();
    } else {
      alert(result.error || 'タグの削除に失敗しました');
    }
  };

  return (
    <div>
      <div style={styles.addForm}>
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="新しいタグ名"
          style={styles.input}
          disabled={actionLoading}
        />
        <button onClick={handleCreate} disabled={actionLoading} style={styles.addButton}>
          追加
        </button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={fetchTags} style={styles.retryButton}>
            再試行
          </button>
        </div>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul style={styles.list}>
          {tags.map((tag) => (
            <li key={tag.id} style={styles.row}>
              <span>{tag.name}</span>
              <button onClick={() => handleDelete(tag)} disabled={actionLoading} style={styles.deleteButton}>
                削除
              </button>
            </li>
          ))}
          {tags.length === 0 && <p style={styles.empty}>タグが登録されていません</p>}
        </ul>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  addForm: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '14px',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#0d6efd',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    color: '#842029',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    margin: 0,
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #dee2e6',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  empty: {
    color: '#6c757d',
    padding: '16px',
  },
};
