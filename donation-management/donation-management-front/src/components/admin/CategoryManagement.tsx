import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { donationApi } from '../../services/donationApi';
import type { Category } from '../../types/donation';

/**
 * カテゴリ管理コンポーネント（管理者のみ追加・削除可能）
 */
export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await donationApi.getCategories();
    if (result.success) {
      setCategories(result.data);
    } else {
      setError(result.error || 'カテゴリの取得に失敗しました');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      alert('カテゴリ名を入力してください');
      return;
    }

    setActionLoading(true);
    const result = await adminApi.createCategory(name, newDescription.trim() || undefined);
    setActionLoading(false);

    if (result.success) {
      setNewName('');
      setNewDescription('');
      await fetchCategories();
    } else {
      alert(result.error || 'カテゴリの作成に失敗しました');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`カテゴリ「${category.name}」を削除しますか？`)) return;

    setActionLoading(true);
    const result = await adminApi.deleteCategory(category.id);
    setActionLoading(false);

    if (result.success) {
      await fetchCategories();
    } else {
      alert(result.error || 'カテゴリの削除に失敗しました');
    }
  };

  return (
    <div>
      <div style={styles.addForm}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいカテゴリ名"
          style={styles.input}
          disabled={actionLoading}
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="説明（任意）"
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
          <button onClick={fetchCategories} style={styles.retryButton}>
            再試行
          </button>
        </div>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul style={styles.list}>
          {categories.map((category) => (
            <li key={category.id} style={styles.row}>
              <div>
                <div>{category.name}</div>
                {category.description && <div style={styles.description}>{category.description}</div>}
                <div style={styles.subCount}>サブカテゴリ: {category.sub_categories?.length || 0}件</div>
              </div>
              <button
                onClick={() => handleDelete(category)}
                disabled={actionLoading}
                style={styles.deleteButton}
              >
                削除
              </button>
            </li>
          ))}
          {categories.length === 0 && <p style={styles.empty}>カテゴリが登録されていません</p>}
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
  description: {
    color: '#6c757d',
    fontSize: '13px',
  },
  subCount: {
    color: '#6c757d',
    fontSize: '12px',
    marginTop: '4px',
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
