import { useState, useEffect } from 'react';
import type { Category, Location, SearchFilters } from '../types/donation';
import { donationApi } from '../services/donationApi';
import './SearchFilter.css';

interface SearchFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export default function SearchFilter({ filters, onFiltersChange }: SearchFilterProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [categoriesResult, locationsResult, tagsResult] = await Promise.all([
          donationApi.getCategories(),
          donationApi.getLocations(),
          donationApi.getTags(),
        ]);

        if (categoriesResult.success) {
          setCategories(categoriesResult.data);
        }

        if (locationsResult.success) {
          setLocations(locationsResult.data);
        }

        if (tagsResult.success) {
          setTags(tagsResult.data);
        }
      } catch (error) {
        console.error('Failed to load filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilterData();
  }, []);

  const handleInputChange = (field: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
    const newFilters = { ...filters, [field]: value };

    // Reset sub_category_id when category_id changes
    if (field === 'category_id') {
      newFilters.sub_category_id = undefined;
    }

    // Reset to first page when filters change
    if (field !== 'page') {
      newFilters.page = 1;
    }

    onFiltersChange(newFilters);
  };

  const selectedCategory = categories.find(cat => cat.id === filters.category_id);

  if (loading) {
    return <div className="search-filter loading">Loading filters...</div>;
  }

  return (
    <div className="search-filter">
      <div className="search-bar">
        <input
          type="text"
          placeholder="キーワードで検索（タイトル、説明、著者）"
          value={filters.keyword}
          onChange={(e) => handleInputChange('keyword', e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="category-select">カテゴリ</label>
          <select
            id="category-select"
            value={filters.category_id || ''}
            onChange={(e) => handleInputChange('category_id', e.target.value || undefined)}
          >
            <option value="">全てのカテゴリ</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {selectedCategory && selectedCategory.sub_categories.length > 0 && (
          <div className="filter-group">
            <label htmlFor="sub-category-select">サブカテゴリ</label>
            <select
              id="sub-category-select"
              value={filters.sub_category_id || ''}
              onChange={(e) => handleInputChange('sub_category_id', e.target.value || undefined)}
            >
              <option value="">全てのサブカテゴリ</option>
              {selectedCategory.sub_categories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="filter-group">
          <label htmlFor="status-select">ステータス</label>
          <select
            id="status-select"
            value={filters.status || ''}
            onChange={(e) => handleInputChange('status', e.target.value || undefined)}
          >
            <option value="">全てのステータス</option>
            <option value="available">利用可能</option>
            <option value="lending">貸出中</option>
            <option value="maintenance">メンテナンス中</option>
            <option value="lost">紛失</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="location-select">保管場所</label>
          <select
            id="location-select"
            value={filters.location_id || ''}
            onChange={(e) => handleInputChange('location_id', e.target.value || undefined)}
          >
            <option value="">全ての場所</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="tag-select">タグ</label>
          <select
            id="tag-select"
            value={filters.tag_id || ''}
            onChange={(e) => handleInputChange('tag_id', e.target.value || undefined)}
          >
            <option value="">全てのタグ</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-select">並び順</label>
          <select
            id="sort-select"
            value={filters.sort}
            onChange={(e) => handleInputChange('sort', e.target.value)}
          >
            <option value="-created_at">新しい順</option>
            <option value="created_at">古い順</option>
            <option value="title">タイトル昇順</option>
            <option value="-title">タイトル降順</option>
            <option value="popular">人気順</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="per-page-select">表示件数</label>
          <select
            id="per-page-select"
            value={filters.per_page}
            onChange={(e) => handleInputChange('per_page', parseInt(e.target.value))}
          >
            <option value={10}>10件</option>
            <option value={20}>20件</option>
            <option value={50}>50件</option>
          </select>
        </div>
      </div>

      <div className="filter-actions">
        <button
          className="clear-filters"
          onClick={() => onFiltersChange({
            keyword: '',
            sort: '-created_at',
            page: 1,
            per_page: 20,
            category_id: undefined,
            sub_category_id: undefined,
            tag_id: undefined,
            status: undefined,
            location_id: undefined,
          })}
        >
          フィルターをクリア
        </button>
      </div>
    </div>
  );
}