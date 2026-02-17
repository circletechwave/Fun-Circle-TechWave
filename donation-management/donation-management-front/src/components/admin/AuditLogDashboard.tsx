import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/adminApi';
import { AuditLogFilter } from './AuditLogFilter';
import { AuditLogTable } from './AuditLogTable';
import type { AuditLog, AuditLogFilters } from '../../types/auditLog';

interface AuditLogDashboardProps {
  onBack: () => void;
}

/**
 * 監査ログダッシュボードコンポーネント
 */
export function AuditLogDashboard({ onBack }: AuditLogDashboardProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    per_page: 50,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminApi.getAuditLogs(filters);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      const message = err instanceof Error ? err.message : 'ログの取得に失敗しました';
      setError(message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (newFilters: AuditLogFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const renderPagination = () => {
    if (pagination.total_pages <= 1) return null;

    const pages: (number | string)[] = [];
    const { page, total_pages } = pagination;

    if (total_pages <= 7) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(total_pages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < total_pages - 2) pages.push('...');
      pages.push(total_pages);
    }

    return (
      <div style={styles.pagination}>
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          style={{ ...styles.pageButton, ...(page === 1 ? styles.pageButtonDisabled : {}) }}
        >
          前へ
        </button>
        {pages.map((p, index) =>
          typeof p === 'number' ? (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              style={{
                ...styles.pageButton,
                ...(p === page ? styles.pageButtonActive : {}),
              }}
            >
              {p}
            </button>
          ) : (
            <span key={`ellipsis-${index}`} style={styles.ellipsis}>
              {p}
            </span>
          )
        )}
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === total_pages}
          style={{
            ...styles.pageButton,
            ...(page === total_pages ? styles.pageButtonDisabled : {}),
          }}
        >
          次へ
        </button>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          戻る
        </button>
        <h1 style={styles.title}>監査ログ</h1>
      </div>

      <AuditLogFilter filters={filters} onFilterChange={handleFilterChange} />

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={fetchLogs} style={styles.retryButton}>
            再試行
          </button>
        </div>
      )}

      <div style={styles.summary}>
        <span>
          {pagination.total}件中 {(pagination.page - 1) * pagination.per_page + 1}-
          {Math.min(pagination.page * pagination.per_page, pagination.total)}件を表示
        </span>
      </div>

      <AuditLogTable logs={logs} loading={loading} />

      {renderPagination()}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
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
  summary: {
    marginBottom: '16px',
    color: '#6c757d',
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
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
  },
  pageButton: {
    padding: '8px 12px',
    border: '1px solid #dee2e6',
    backgroundColor: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  pageButtonActive: {
    backgroundColor: '#0d6efd',
    color: '#fff',
    borderColor: '#0d6efd',
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  ellipsis: {
    padding: '8px 4px',
    color: '#6c757d',
  },
};
