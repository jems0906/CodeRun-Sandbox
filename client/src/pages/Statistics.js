import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Clock, Database, Award } from 'lucide-react';
import { statsAPI, submissionsAPI } from '../services/api';

const Statistics = () => {
  // Fetch platform statistics
  const { data: platformStats, isLoading: platformLoading } = useQuery(
    ['platformStats'],
    statsAPI.getPlatform
  );

  // Fetch recent submissions
  const { data: recentSubmissions, isLoading: submissionsLoading } = useQuery(
    ['recentSubmissions'],
    () => submissionsAPI.getAll({ limit: 10 })
  );

  // Note: Leaderboard functionality available but not used in current UI

  const StatCard = ({ icon, title, value, subtitle, color = '#2563eb' }) => (
    <div style={{
      background: '#fff',
      padding: '1.5rem',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{
        padding: '0.75rem',
        borderRadius: '0.5rem',
        background: `${color}20`,
        color: color
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e293b' }}>
          {value}
        </div>
        <div style={{ color: '#64748b', fontWeight: '500' }}>{title}</div>
        {subtitle && (
          <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{subtitle}</div>
        )}
      </div>
    </div>
  );

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num?.toString() || '0';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'Easy': '#22c55e',
      'Medium': '#f59e0b',
      'Hard': '#ef4444'
    };
    return colors[difficulty] || '#64748b';
  };

  const getStatusColor = (status, result) => {
    if (status === 'completed' && result === 'Accepted') return '#22c55e';
    if (status === 'failed' || result === 'Wrong Answer') return '#ef4444';
    if (status === 'pending') return '#3b82f6';
    return '#64748b';
  };

  if (platformLoading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner">
            <BarChart3 size={24} />
          </div>
          <span style={{ marginLeft: '0.5rem' }}>Loading statistics...</span>
        </div>
      </div>
    );
  }

  const stats = platformStats?.data;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1e293b' }}>
          Platform Statistics
        </h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Overview of problems, submissions, and community activity
        </p>
      </div>

      {/* Overview Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '3rem' 
      }}>
        <StatCard
          icon={<BarChart3 size={24} />}
          title="Total Problems"
          value={formatNumber(stats?.overview?.totalProblems)}
          subtitle="Available to solve"
          color="#2563eb"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          title="Total Submissions"
          value={formatNumber(stats?.overview?.totalSubmissions)}
          subtitle="Code executions"
          color="#059669"
        />
        <StatCard
          icon={<Clock size={24} />}
          title="Avg Runtime"
          value={`${stats?.overview?.averageRuntime || 0}ms`}
          subtitle="Execution time"
          color="#dc2626"
        />
        <StatCard
          icon={<Database size={24} />}
          title="Avg Memory"
          value={`${stats?.overview?.averageMemory || 0}KB`}
          subtitle="Memory usage"
          color="#7c3aed"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Problem Distribution */}
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #e2e8f0' 
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} />
            Problems by Difficulty
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats?.problems?.byDifficulty?.map((diff) => (
              <div key={diff.difficulty} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: getDifficultyColor(diff.difficulty)
                  }} />
                  <span style={{ fontWeight: '500' }}>{diff.difficulty}</span>
                </div>
                <span style={{ 
                  color: '#64748b',
                  background: '#f8fafc',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem'
                }}>
                  {diff.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Statistics */}
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #e2e8f0' 
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} />
            Language Usage
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats?.submissions?.byLanguage?.map((lang) => (
              <div key={lang.language} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{lang.language}</span>
                </div>
                <span style={{ 
                  color: '#64748b',
                  background: '#f8fafc',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem'
                }}>
                  {formatNumber(lang.submissions)} submissions
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #e2e8f0' 
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} />
            Recent Submissions
          </h3>
          {submissionsLoading ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
              Loading submissions...
            </div>
          ) : recentSubmissions?.data?.submissions?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentSubmissions.data.submissions.slice(0, 5).map((submission) => (
                <div key={submission.id} style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#1e293b' }}>
                      {submission.problem_title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {submission.language} • {new Date(submission.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    background: `${getStatusColor(submission.status, submission.result)}20`,
                    color: getStatusColor(submission.status, submission.result)
                  }}>
                    {submission.result || submission.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              No submissions yet
            </div>
          )}
        </div>

        {/* Success Rate by Language */}
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #e2e8f0' 
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} />
            Success Rate by Language
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats?.submissions?.successRateByLanguage?.map((lang) => (
              <div key={lang.language} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{lang.language}</span>
                  <span style={{ color: '#22c55e', fontWeight: '500' }}>{lang.success_rate}%</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '6px', 
                  background: '#f1f5f9', 
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${lang.success_rate}%`,
                    height: '100%',
                    background: '#22c55e',
                    borderRadius: '3px'
                  }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {lang.successful_submissions} / {lang.total_submissions} submissions
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      {stats?.performance && (
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: '0.75rem', 
          border: '1px solid #e2e8f0',
          marginTop: '2rem'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} />
            Performance Insights
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                {formatNumber(stats.performance.totalCompleted)}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Completed Executions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                {stats.performance.runtime.minimum}ms
              </div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Fastest Runtime</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                {stats.performance.runtime.maximum}ms
              </div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Slowest Runtime</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7c3aed' }}>
                {stats.performance.memory.average}KB
              </div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Avg Memory Usage</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;