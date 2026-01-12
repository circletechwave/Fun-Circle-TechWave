import { useState } from 'react';
import type { Donation, SearchFilters } from '../types/donation';
import { useDonations } from '../hooks/useDonations';
import SearchFilter from './SearchFilter';
import DonationList from './DonationList';
import './DonationSearch.css';

const DEFAULT_FILTERS: SearchFilters = {
  keyword: '',
  sort: '-created_at',
  page: 1,
  per_page: 20,
};

interface DonationSearchProps {
  onCreate?: () => void;
  onDetail?: (donation: Donation) => void;
}

export default function DonationSearch({ onCreate, onDetail }: DonationSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  // React Queryで寄贈物一覧を取得
  const { data: result, isLoading, error } = useDonations(filters);

  // データとページネーション情報を抽出
  const donations = result?.data || [];
  const pagination = result?.pagination || {
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  };
  const errorMessage = error ? '検索中にエラーが発生しました' : undefined;

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="donation-search">
      <div className="search-header">
        <h1>寄贈物検索</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0 }}>社内に寄贈された書籍・備品を検索できます</p>
          <button
            onClick={onCreate}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ＋ 新規登録
          </button>
        </div>
      </div>

      <SearchFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <DonationList
        donations={donations}
        pagination={pagination}
        loading={isLoading}
        error={errorMessage}
        onPageChange={handlePageChange}
        onDetail={onDetail}
      />
    </div>
  );
}