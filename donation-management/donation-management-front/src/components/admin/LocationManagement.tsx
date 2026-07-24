import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { donationApi } from '../../services/donationApi';
import type { Location } from '../../types/donation';

/**
 * 保管場所管理コンポーネント（管理者のみ追加・削除可能）
 */
export function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newFloor, setNewFloor] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newShelf, setNewShelf] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await donationApi.getLocations();
    if (result.success) {
      setLocations(result.data);
    } else {
      setError(result.error || '保管場所の取得に失敗しました');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      alert('保管場所名を入力してください');
      return;
    }

    setActionLoading(true);
    const result = await adminApi.createLocation({
      name,
      building: newBuilding.trim() || undefined,
      floor: newFloor.trim() || undefined,
      room: newRoom.trim() || undefined,
      shelf: newShelf.trim() || undefined,
    });
    setActionLoading(false);

    if (result.success) {
      setNewName('');
      setNewBuilding('');
      setNewFloor('');
      setNewRoom('');
      setNewShelf('');
      await fetchLocations();
    } else {
      alert(result.error || '保管場所の作成に失敗しました');
    }
  };

  const handleDelete = async (location: Location) => {
    if (!confirm(`保管場所「${location.name}」を削除しますか？`)) return;

    setActionLoading(true);
    const result = await adminApi.deleteLocation(location.id);
    setActionLoading(false);

    if (result.success) {
      await fetchLocations();
    } else {
      alert(result.error || '保管場所の削除に失敗しました');
    }
  };

  return (
    <div>
      <div style={styles.addForm}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="保管場所名"
          style={styles.input}
          disabled={actionLoading}
        />
        <input
          type="text"
          value={newBuilding}
          onChange={(e) => setNewBuilding(e.target.value)}
          placeholder="建物（任意）"
          style={styles.input}
          disabled={actionLoading}
        />
        <input
          type="text"
          value={newFloor}
          onChange={(e) => setNewFloor(e.target.value)}
          placeholder="階（任意）"
          style={styles.input}
          disabled={actionLoading}
        />
        <input
          type="text"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
          placeholder="部屋（任意）"
          style={styles.input}
          disabled={actionLoading}
        />
        <input
          type="text"
          value={newShelf}
          onChange={(e) => setNewShelf(e.target.value)}
          placeholder="棚（任意）"
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
          <button onClick={fetchLocations} style={styles.retryButton}>
            再試行
          </button>
        </div>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <ul style={styles.list}>
          {locations.map((location) => (
            <li key={location.id} style={styles.row}>
              <div>
                <div>{location.name}</div>
                <div style={styles.description}>
                  {[location.building, location.floor, location.room, location.shelf].filter(Boolean).join(' / ')}
                </div>
              </div>
              <button
                onClick={() => handleDelete(location)}
                disabled={actionLoading}
                style={styles.deleteButton}
              >
                削除
              </button>
            </li>
          ))}
          {locations.length === 0 && <p style={styles.empty}>保管場所が登録されていません</p>}
        </ul>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  addForm: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
  },
  input: {
    flex: '1 1 120px',
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
