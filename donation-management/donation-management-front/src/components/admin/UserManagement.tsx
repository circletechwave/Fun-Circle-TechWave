import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import type { AppUser, UserRole } from '../../types/user';

interface UserManagementProps {
  onBack: () => void;
  currentUserId?: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: '一般ユーザー',
  admin: '管理者',
  system: 'システム',
};

/**
 * ユーザー管理コンポーネント（管理者のみ、他ユーザーのロールを昇格・降格可能）
 */
export function UserManagement({ onBack, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await adminApi.getUsers();
    if (result.success) {
      setUsers(result.data);
    } else {
      setError(result.error || 'ユーザー一覧の取得に失敗しました');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (targetUser: AppUser, newRole: UserRole) => {
    if (newRole === targetUser.role) return;
    if (!confirm(`「${targetUser.name}」のロールを「${ROLE_LABELS[newRole]}」に変更しますか？`)) return;

    setActionLoading(true);
    const result = await adminApi.updateUserRole(targetUser, newRole);
    setActionLoading(false);

    if (result.success) {
      await fetchUsers();
    } else {
      alert(result.error || 'ロールの変更に失敗しました');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          戻る
        </button>
        <h1 style={styles.title}>ユーザー管理</h1>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={fetchUsers} style={styles.retryButton}>
            再試行
          </button>
        </div>
      )}

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>氏名</th>
              <th style={styles.th}>メールアドレス</th>
              <th style={styles.th}>部署</th>
              <th style={styles.th}>ロール</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>
                  {user.name}
                  {user.id === currentUserId && <span style={styles.selfTag}>（自分）</span>}
                </td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.department || '-'}</td>
                <td style={styles.td}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                    disabled={actionLoading || user.id === currentUserId}
                    style={styles.select}
                  >
                    <option value="user">{ROLE_LABELS.user}</option>
                    <option value="admin">{ROLE_LABELS.admin}</option>
                    <option value="system">{ROLE_LABELS.system}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: '2px solid #dee2e6',
    fontSize: '13px',
    color: '#6c757d',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
  },
  select: {
    padding: '6px 10px',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    fontSize: '13px',
  },
  selfTag: {
    color: '#6c757d',
    fontSize: '12px',
    marginLeft: '4px',
  },
};
