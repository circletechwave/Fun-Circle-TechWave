import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { donationApi } from '../../services/donationApi';
import type { Category, SubCategory } from '../../types/donation';

/**
 * サブカテゴリ管理コンポーネント（管理者のみ追加・削除可能）
 * サブカテゴリはカテゴリに紐づくため、対象カテゴリを選択してから操作する
 */
export function SubCategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
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
      setSelectedCategoryId((prev) => prev || result.data[0]?.id || '');
    } else {
      setError(result.error || 'カテゴリの取得に失敗しました');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!selectedCategoryId) {
      alert('カテゴリを選択してください');
      return;
    }
    if (!name) {
      alert('サブカテゴリ名を入力してください');
      return;
    }

    setActionLoading(true);
    const result = await adminApi.createSubCategory(selectedCategoryId, name, newDescription.trim() || undefined);
    setActionLoading(false);

    if (result.success) {
      setNewName('');
      setNewDescription('');
      await fetchCategories();
    } else {
      alert(result.error || 'サブカテゴリの作成に失敗しました');
    }
  };

  const handleDelete = async (subCategory: SubCategory) => {
    if (!confirm(`サブカテゴリ「${subCategory.name}」を削除しますか？`)) return;

    setActionLoading(true);
    const result = await adminApi.deleteSubCategory(subCategory.id);
    setActionLoading(false);

    if (result.success) {
      await fetchCategories();
    } else {
      alert(result.error || 'サブカテゴリの削除に失敗しました');
    }
  };

  if (loading) return <p>読み込み中...</p>;

  return (
    <div>
      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={fetchCategories} style={styles.retryButton}>
            再試行
          </button>
        </div>
      )}

      <div style={styles.categorySelect}>
        <label htmlFor="category-select">対象カテゴリ</label>
        <select
          id="category-select"
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          style={styles.select}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.addForm}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新しいサブカテゴリ名"
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

      <ul style={styles.list}>
        {selectedCategory?.sub_categories.map((subCategory) => (
          <li key={subCategory.id} style={styles.row}>
            <div>
              <div>{subCategory.name}</div>
              {subCategory.description && <div style={styles.description}>{subCategory.description}</div>}
            </div>
            <button
              onClick={() => handleDelete(subCategory)}
              disabled={actionLoading}
              style={styles.deleteButton}
            >
              削除
            </button>
          </li>
        ))}
        {(!selectedCategory || selectedCategory.sub_categories.length === 0) && (
          <p style={styles.empty}>このカテゴリにサブカテゴリが登録されていません</p>
        )}
      </ul>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  categorySelect: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '14px',
  },
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
