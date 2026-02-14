import { useState } from 'react';
import type { AuditAction, AuditLogFilters } from '../../types/auditLog';
import { ACTION_LABELS } from '../../types/auditLog';

interface AuditLogFilterProps {
  filters: AuditLogFilters;
  onFilterChange: (filters: AuditLogFilters) => void;
}

/**
 * 監査ログフィルターコンポーネント
 */
export function AuditLogFilter({ filters, onFilterChange }: AuditLogFilterProps) {
  const [localFilters, setLocalFilters] = useState<AuditLogFilters>(filters);

  const handleChange = (key: keyof AuditLogFilters, value: string | number | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleSearch = () => {
    onFilterChange({ ...localFilters, page: 1 });
  };

  const handleReset = () => {
    const resetFilters: AuditLogFilters = {
      page: 1,
      per_page: 50,
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const actionOptions: AuditAction[] = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE',
    'LOGOUT',
    'AUTH_ERROR',
    'PERMISSION_DENIED',
    'DONATION_CREATE',
    'DONATION_UPDATE',
    'DONATION_DELETE',
    'LENDING_CREATE',
    'LENDING_RETURN',
    'API_ERROR',
  ];

  return (
    <div style={styles.container}>
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>アクション</label>
          <select
            value={localFilters.action || ''}
            onChange={(e) => handleChange('action', e.target.value || undefined)}
            style={styles.select}
          >
            <option value="">すべて</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {ACTION_LABELS[action]}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>開始日</label>
          <input
            type="date"
            value={localFilters.date_from || ''}
            onChange={(e) => handleChange('date_from', e.target.value || undefined)}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>終了日</label>
          <input
            type="date"
            value={localFilters.date_to || ''}
            onChange={(e) => handleChange('date_to', e.target.value || undefined)}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>キーワード</label>
          <input
            type="text"
            value={localFilters.keyword || ''}
            onChange={(e) => handleChange('keyword', e.target.value || undefined)}
            placeholder="メール、パス、エラー"
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.buttonRow}>
        <button onClick={handleSearch} style={styles.searchButton}>
          検索
        </button>
        <button onClick={handleReset} style={styles.resetButton}>
          リセット
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '16px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '150px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#495057',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  input: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ced4da',
    fontSize: '14px',
  },
  buttonRow: {
    display: 'flex',
    gap: '8px',
  },
  searchButton: {
    padding: '8px 16px',
    backgroundColor: '#0d6efd',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  resetButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
