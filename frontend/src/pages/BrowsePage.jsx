import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import CampaignCard from '../components/CampaignCard';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import { Search, Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const currentCategory = searchParams.get('category') || '';
  const currentStatus = searchParams.get('status') || 'active';
  const currentSort = searchParams.get('sort') || 'trending';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(currentSearch);

  // Fetch categories
  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.data.categories || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (currentCategory) queryParams.set('category', currentCategory);
        if (currentStatus) queryParams.set('status', currentStatus);
        if (currentSort) queryParams.set('sort', currentSort);
        if (currentSearch) queryParams.set('search', currentSearch);
        queryParams.set('page', currentPage);
        queryParams.set('limit', 9);

        const res = await api.get(`/campaigns?${queryParams.toString()}`);
        setCampaigns(res.data.data.campaigns || []);
        setPagination(res.data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      } catch (err) {
        console.error('Failed to load campaigns', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [currentCategory, currentStatus, currentSort, currentSearch, currentPage]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Filters start a new result set; pagination itself must preserve the requested page.
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Explore Campaigns</h1>
        <p className="text-gray-500 mt-1">Discover, pledge, and bring groundbreaking ideas into reality.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns by keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
            />
          </form>

          {/* Status & Sort Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Status:</span>
              <select
                value={currentStatus}
                onChange={(e) => updateParam('status', e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="active">Active Now</option>
                <option value="successful">Funded</option>
                <option value="failed">Unsuccessful</option>
                <option value="all">All Statuses</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Sort:</span>
              <select
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="ending_soon">Ending Soon</option>
                <option value="most_funded">Most Funded</option>
                <option value="most_backed">Most Backers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          <button
            onClick={() => updateParam('category', '')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              !currentCategory
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                currentCategory === cat.slug
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-gray-500 font-medium">
        <span>Found <strong className="text-gray-900">{pagination.total}</strong> campaigns</span>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <Loader text="Loading campaigns..." />
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center space-y-4">
          <SlidersHorizontal className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No campaigns found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting another category, or changing the status filter.
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              setSearchParams(new URLSearchParams({ status: 'active' }));
            }}
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((camp) => (
              <CampaignCard key={camp.id} campaign={camp} />
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => updateParam('page', p)}
          />
        </>
      )}
    </div>
  );
}

