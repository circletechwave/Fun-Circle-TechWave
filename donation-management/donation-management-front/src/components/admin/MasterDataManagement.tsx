import { useState } from 'react';
import { CategoryManagement } from './CategoryManagement';
import { SubCategoryManagement } from './SubCategoryManagement';
import { LocationManagement } from './LocationManagement';
import { TagManagement } from './TagManagement';

interface MasterDataManagementProps {
  onBack: () => void;
}

type MasterDataTab = 'categories' | 'sub_categories' | 'locations' | 'tags';

/**
 * マスタデータ（カテゴリ・サブカテゴリ・保管場所・タグ）管理コンポーネント
 * 管理者のみ追加・削除可能
 */
export function MasterDataManagement({ onBack }: MasterDataManagementProps) {
  const [tab, setTab] = useState<MasterDataTab>('categories');

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          戻る
        </button>
        <h1 style={styles.title}>マスタ管理</h1>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setTab('categories')}
          style={{ ...styles.tabButton, ...(tab === 'categories' ? styles.tabButtonActive : {}) }}
        >
          カテゴリ
        </button>
        <button
          onClick={() => setTab('sub_categories')}
          style={{ ...styles.tabButton, ...(tab === 'sub_categories' ? styles.tabButtonActive : {}) }}
        >
          サブカテゴリ
        </button>
        <button
          onClick={() => setTab('locations')}
          style={{ ...styles.tabButton, ...(tab === 'locations' ? styles.tabButtonActive : {}) }}
        >
          保管場所
        </button>
        <button
          onClick={() => setTab('tags')}
          style={{ ...styles.tabButton, ...(tab === 'tags' ? styles.tabButtonActive : {}) }}
        >
          タグ
        </button>
      </div>

      {tab === 'categories' && <CategoryManagement />}
      {tab === 'sub_categories' && <SubCategoryManagement />}
      {tab === 'locations' && <LocationManagement />}
      {tab === 'tags' && <TagManagement />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '700px',
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
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #dee2e6',
  },
  tabButton: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#6c757d',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
  },
  tabButtonActive: {
    color: '#0d6efd',
    borderBottom: '2px solid #0d6efd',
    fontWeight: '600',
  },
};
