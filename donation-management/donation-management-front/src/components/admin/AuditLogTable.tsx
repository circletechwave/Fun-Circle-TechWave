import type { AuditLog } from '../../types/auditLog';
import { ACTION_LABELS, ACTION_CATEGORIES } from '../../types/auditLog';

interface AuditLogTableProps {
  logs: AuditLog[];
  loading: boolean;
}

/**
 * 監査ログテーブルコンポーネント
 */
export function AuditLogTable({ logs, loading }: AuditLogTableProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadgeStyle = (action: AuditLog['action']): React.CSSProperties => {
    const category = ACTION_CATEGORIES[action];
    const isError = action.includes('ERROR') || action.includes('FAILURE') || action === 'PERMISSION_DENIED';

    if (isError) {
      return { ...styles.badge, backgroundColor: '#dc3545', color: '#fff' };
    }

    if (category === 'security') {
      return { ...styles.badge, backgroundColor: '#ffc107', color: '#212529' };
    }

    return { ...styles.badge, backgroundColor: '#0d6efd', color: '#fff' };
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <p>ログが見つかりません</p>
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>日時</th>
            <th style={styles.th}>アクション</th>
            <th style={styles.th}>ユーザー</th>
            <th style={styles.th}>テーブル</th>
            <th style={styles.th}>パス</th>
            <th style={styles.th}>エラー</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={styles.tr}>
              <td style={styles.td}>{formatDate(log.created_at)}</td>
              <td style={styles.td}>
                <span style={getActionBadgeStyle(log.action)}>
                  {ACTION_LABELS[log.action]}
                </span>
              </td>
              <td style={styles.td}>
                {log.user_email || '-'}
              </td>
              <td style={styles.td}>
                {log.table_name || '-'}
              </td>
              <td style={styles.td}>
                <span style={styles.path}>
                  {log.request_method && `${log.request_method} `}
                  {log.request_path || '-'}
                </span>
              </td>
              <td style={styles.td}>
                {log.error_message ? (
                  <span style={styles.errorMessage} title={log.error_message}>
                    {log.error_message.substring(0, 50)}
                    {log.error_message.length > 50 ? '...' : ''}
                  </span>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    backgroundColor: '#f8f9fa',
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #dee2e6',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #dee2e6',
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  path: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#495057',
  },
  errorMessage: {
    color: '#dc3545',
    fontSize: '12px',
    cursor: 'help',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
    color: '#6c757d',
  },
  emptyContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px',
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
};
