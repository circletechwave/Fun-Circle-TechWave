import { useState, useEffect, useCallback } from 'react';
import type { Donation, SearchFilters, PaginationInfo } from '../types/donation';
import { donationApi } from '../services/donationApi';
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
  onEdit?: (donation: Donation) => void;
  onDetail?: (donation: Donation) => void;
}

export default function DonationSearch({ onCreate, onEdit, onDetail }: DonationSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const searchDonations = useCallback(async (searchFilters: SearchFilters) => {
    setLoading(true);
    setError(undefined);

    try {
      const result = await donationApi.searchDonations(searchFilters);

      if (result.success) {
        setDonations(result.data);
        setPagination(result.pagination);
      } else {
        setError(result.error || '検索に失敗しました');
        setDonations([]);
        setPagination({
          page: 1,
          per_page: 20,
          total: 0,
          total_pages: 0,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '検索中にエラーが発生しました';
      setError(errorMessage);
      setDonations([]);
      setPagination({
        page: 1,
        per_page: 20,
        total: 0,
        total_pages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and filter changes
  useEffect(() => {
    searchDonations(filters);
  }, [filters, searchDonations]);

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
        loading={loading}
        error={error}
        onPageChange={handlePageChange}
        onDetail={onDetail}
      />
    </div>
  );
}