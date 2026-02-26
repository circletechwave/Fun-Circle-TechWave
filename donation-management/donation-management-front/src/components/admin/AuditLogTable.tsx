import { useState } from 'react';
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
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
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

  const renderDetailModal = () => {
    if (!selectedLog) return null;

    return (
      <div style={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>ログ詳細</h3>
            <button style={styles.closeButton} onClick={() => setSelectedLog(null)}>
              ×
            </button>
          </div>
          <div style={styles.modalBody}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>日時:</span>
              <span>{formatDate(selectedLog.created_at)}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>アクション:</span>
              <span style={getActionBadgeStyle(selectedLog.action)}>
                {ACTION_LABELS[selectedLog.action]}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>ユーザー:</span>
              <span>{selectedLog.user_email || '-'}</span>
            </div>
            {selectedLog.record_id && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>レコードID:</span>
                <span style={styles.monospace}>{selectedLog.record_id}</span>
              </div>
            )}
            {selectedLog.old_values && (
              <div style={styles.detailSection}>
                <span style={styles.detailLabel}>変更前:</span>
                <pre style={styles.jsonBlock}>
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}
            {selectedLog.new_values && (
              <div style={styles.detailSection}>
                <span style={styles.detailLabel}>変更後:</span>
                <pre style={styles.jsonBlock}>
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}
            {selectedLog.error_message && (
              <div style={styles.detailSection}>
                <span style={styles.detailLabel}>エラー:</span>
                <div style={styles.errorBlock}>{selectedLog.error_message}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>日時</th>
              <th style={styles.th}>アクション</th>
              <th style={styles.th}>ユーザー</th>
              <th style={styles.th}>テーブル</th>
              <th style={styles.th}>詳細</th>
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
                  <button
                    style={styles.detailButton}
                    onClick={() => setSelectedLog(log)}
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderDetailModal()}
    </>
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
  detailButton: {
    padding: '4px 12px',
    backgroundColor: '#0d6efd',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #dee2e6',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6c757d',
    padding: 0,
    lineHeight: 1,
  },
  modalBody: {
    padding: '24px',
  },
  detailRow: {
    display: 'flex',
    marginBottom: '12px',
    gap: '8px',
  },
  detailSection: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px',
    gap: '8px',
  },
  detailLabel: {
    fontWeight: '600',
    minWidth: '100px',
    color: '#495057',
  },
  monospace: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#f8f9fa',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  jsonBlock: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    margin: 0,
  },
  errorBlock: {
    backgroundColor: '#f8d7da',
    color: '#842029',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
  },
};
