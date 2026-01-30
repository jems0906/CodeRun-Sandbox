import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Clock, Code2 } from 'lucide-react';
import { problemsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProblemList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const itemsPerPage = 10;

  // Fetch problems
  const { data: problemsData, isLoading, error } = useQuery(
    ['problems', currentPage, filterDifficulty, filterCategory],
    () => problemsAPI.getAll({
      page: currentPage,
      limit: itemsPerPage,
      difficulty: filterDifficulty || undefined,
      category: filterCategory || undefined,
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error('Failed to load problems');
        console.error('Problems fetch error:', error);
      }
    }
  );

  // Fetch problem stats for filters
  const { data: statsData } = useQuery(
    ['problemStats'],
    problemsAPI.getStats,
    {
      onError: () => {
        // Stats fetch error handled silently
      }
    }
  );

  // Search functionality
  const { data: searchResults, isLoading: isSearchLoading } = useQuery(
    ['problemSearch', searchTerm],
    () => problemsAPI.search(searchTerm, { limit: 20 }),
    {
      enabled: searchTerm.length >= 2,
      onSuccess: () => setIsSearching(true),
      onError: (error) => {
        toast.error('Search failed');
        console.error('Search error:', error);
      }
    }
  );

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
  };

  // Determine which problems to display
  const displayProblems = useMemo(() => {
    if (searchTerm.length >= 2 && searchResults?.data?.problems) {
      return searchResults.data.problems;
    }
    return problemsData?.data?.problems || [];
  }, [searchTerm, searchResults, problemsData]);

  // Pagination info
  const paginationInfo = problemsData?.data?.pagination;

  const getDifficultyClass = (difficulty) => {
    return `difficulty ${difficulty.toLowerCase()}`;
  };

  const formatDescription = (description) => {
    if (!description) return '';
    const firstParagraph = description.split('\n\n')[0];
    return firstParagraph.length > 150 
      ? firstParagraph.substring(0, 150) + '...' 
      : firstParagraph;
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner">
            <Code2 size={24} />
          </div>
          <span style={{ marginLeft: '0.5rem' }}>Loading problems...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h3>Error Loading Problems</h3>
          <p>Unable to fetch problems. Please check your connection and try again.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>
          Practice Problems
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Sharpen your skills with our curated collection of coding challenges
        </p>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        background: '#fff', 
        padding: '1.5rem', 
        borderRadius: '0.75rem', 
        border: '1px solid #e2e8f0',
        marginBottom: '2rem'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search 
            size={20} 
            style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#64748b' 
            }} 
          />
          <input
            type="text"
            placeholder="Search problems by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 3rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        {!isSearching && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ color: '#64748b' }} />
              <span style={{ color: '#64748b', fontWeight: '500' }}>Filter:</span>
            </div>
            
            <select
              value={filterDifficulty}
              onChange={(e) => {
                setFilterDifficulty(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value="">All Categories</option>
              {statsData?.data?.categories?.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>

            {(filterDifficulty || filterCategory) && (
              <button
                onClick={() => {
                  setFilterDifficulty('');
                  setFilterCategory('');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading indicator for search */}
      {isSearchLoading && (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
          Searching...
        </div>
      )}

      {/* Results header */}
      {isSearching && searchResults && (
        <div style={{ marginBottom: '1rem', color: '#64748b' }}>
          Found {searchResults.data.problems.length} problems matching "{searchTerm}"
        </div>
      )}

      {/* Problems List */}
      <div className="problem-list">
        {displayProblems.length > 0 ? displayProblems.map((problem) => (
          <Link 
            key={problem.id} 
            to={`/problems/${problem.id}`} 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="problem-card">
              <div className="problem-header">
                <h3 className="problem-title">{problem.title}</h3>
                <span className={getDifficultyClass(problem.difficulty)}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="problem-category">
                <strong>Category:</strong> {problem.category}
              </div>
              {problem.time_complexity && (
                <div style={{ 
                  color: '#64748b', 
                  fontSize: '0.875rem', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Clock size={14} />
                  Time: {problem.time_complexity} | Space: {problem.space_complexity}
                </div>
              )}
              <p className="problem-description">
                {formatDescription(problem.description)}
              </p>
            </div>
          </Link>
        )) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: '#64748b',
            background: '#fff',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0'
          }}>
            <Code2 size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '0.5rem' }}>No problems found</h3>
            <p>
              {isSearching 
                ? `No problems match your search for "${searchTerm}"`
                : 'Try adjusting your filters or search terms'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isSearching && paginationInfo && paginationInfo.totalPages > 1 && (
        <div style={{ 
          marginTop: '2rem', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          
          <span style={{ color: '#64748b' }}>
            Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
            ({paginationInfo.totalItems} problems)
          </span>
          
          <button
            className="btn btn-secondary"
            disabled={currentPage === paginationInfo.totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProblemList;