import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import applicationApi from '../api/applications';
import toast from 'react-hot-toast';

const STAGE_CONFIG = [
  { name: 'Wishlist', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: '#94a3b8' },
  { name: 'Applied', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6' },
  { name: 'OA/Screening', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7' },
  { name: 'Interview', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
  { name: 'Offer', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981' },
  { name: 'Rejected', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, followUpsRes] = await Promise.all([
        applicationApi.getStatsSummary(),
        applicationApi.getUpcomingFollowUps(7),
      ]);

      setStats(statsRes?.data || null);
      setFollowUps(followUpsRes?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle Mark Done (clears followUpDate)
  const handleMarkDone = async (appId, company) => {
    try {
      setActionInProgressId(appId);
      await applicationApi.update(appId, {
        followUpDate: null,
      });

      toast.success(`Follow-up for ${company} marked as done!`);

      // Update follow-ups locally
      setFollowUps((prev) => prev.filter((item) => item._id !== appId));

      // Update upcoming follow-up count in stats
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          upcomingFollowUpsCount: Math.max(0, (prev.upcomingFollowUpsCount || 1) - 1),
        };
      });
    } catch (err) {
      toast.error(err.message || 'Failed to update follow-up status');
    } finally {
      setActionInProgressId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // 1. Error State
  if (error) {
    return (
      <div className="container">
        <div className="error-card">
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚠️</div>
          <h2 className="error-title">Could not load Dashboard</h2>
          <p className="error-desc">{error}</p>
          <button className="btn-retry" onClick={fetchDashboardData}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // 2. Loading Skeleton State
  if (loading) {
    return (
      <div className="container">
        <div className="page-header">
          <div>
            <div className="skeleton skeleton-text" style={{ width: '180px', height: '28px' }} />
            <div className="skeleton skeleton-text" style={{ width: '280px', height: '14px' }} />
          </div>
          <div className="skeleton" style={{ width: '140px', height: '38px' }} />
        </div>

        {/* Skeleton Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>

        {/* Skeleton Chart */}
        <div className="chart-card skeleton" style={{ height: '220px', marginBottom: '24px' }} />

        {/* Skeleton Follow-ups */}
        <div className="banner-card skeleton" style={{ height: '260px' }} />
      </div>
    );
  }

  const total = stats?.total || 0;
  const overdueFollowUps = followUps.filter((f) => f.overdue || f.isOverdue);
  const upcomingFollowUps = followUps.filter((f) => !f.overdue && !f.isOverdue);

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Track your application progress, follow-up deadlines, and funnel metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/applications" className="btn-secondary">
            View Applications
          </Link>
          <Link to="/applications/new" className="btn-primary">
            + New Application
          </Link>
        </div>
      </div>

      {/* 1. Summary Cards (Total + per stage colored) */}
      <section style={{ marginBottom: '24px' }}>
        <div className="stats-grid">
          {/* Total card */}
          <div
            className="stat-card"
            onClick={() => navigate('/applications')}
            style={{ borderLeft: '4px solid var(--primary)' }}
          >
            <span className="stat-label">Total Applications</span>
            <span className="stat-value">{total}</span>
          </div>

          {/* Per Stage cards */}
          {STAGE_CONFIG.map((cfg) => {
            const count = stats?.byStage?.[cfg.name] || 0;
            return (
              <div
                key={cfg.name}
                className="stat-card"
                onClick={() => navigate(`/applications?stage=${encodeURIComponent(cfg.name)}`)}
                style={{
                  borderLeft: `4px solid ${cfg.color}`,
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="stat-label" style={{ color: cfg.color }}>{cfg.name}</span>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: cfg.color,
                      display: 'inline-block',
                    }}
                  />
                </div>
                <span className="stat-value">{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Stage-Distribution Bar Chart (Simple CSS / SVG - No library) */}
      <section className="chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Stage Distribution</h3>
            <p className="chart-subtitle">Pipeline breakdown across application stages</p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Total: <strong>{total}</strong>
          </span>
        </div>

        {total === 0 ? (
          <div className="empty-state" style={{ padding: '24px', margin: '8px 0' }}>
            <p className="empty-desc" style={{ marginBottom: 0 }}>
              No applications tracked yet to display distribution chart.
            </p>
          </div>
        ) : (
          <>
            {/* Proportion Stacked Bar */}
            <div className="chart-stacked-bar">
              {STAGE_CONFIG.map((cfg) => {
                const count = stats?.byStage?.[cfg.name] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                if (percentage === 0) return null;
                return (
                  <div
                    key={cfg.name}
                    className="chart-stacked-segment"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: cfg.color,
                    }}
                    title={`${cfg.name}: ${count} (${percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Individual Progress Bars Grid */}
            <div className="chart-grid">
              {STAGE_CONFIG.map((cfg) => {
                const count = stats?.byStage?.[cfg.name] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={cfg.name} className="chart-row">
                    <div className="chart-stage-name">
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '2px',
                          backgroundColor: cfg.color,
                          display: 'inline-block',
                        }}
                      />
                      <span>{cfg.name}</span>
                    </div>

                    <div className="chart-track">
                      <div
                        className="chart-fill"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: cfg.color,
                        }}
                      />
                    </div>

                    <div className="chart-values">
                      <span>{count}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px' }}>
                        ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* 3. Upcoming & Overdue Follow-ups List */}
      <section className="banner-card">
        <div className="banner-title" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔔</span>
            <span>Follow-up Reminders</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              ({followUps.length} pending)
            </span>
          </div>
          {overdueFollowUps.length > 0 && (
            <span
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              ⚠️ {overdueFollowUps.length} Overdue
            </span>
          )}
        </div>

        {/* Empty State for Follow-ups */}
        {followUps.length === 0 ? (
          <div className="empty-state" style={{ padding: '36px 20px', borderStyle: 'solid' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🎉</span>
            <h4 className="empty-title">All Caught Up!</h4>
            <p className="empty-desc">
              No follow-ups due in the next 7 days or overdue. Keep up the good work!
            </p>
          </div>
        ) : (
          <div className="banner-grid">
            {followUps.map((app) => {
              const isOverdue = app.overdue || app.isOverdue;
              const isBusy = actionInProgressId === app._id;

              return (
                <div
                  key={app._id}
                  className={`reminder-item ${isOverdue ? 'overdue' : 'upcoming'}`}
                  style={{
                    border: isOverdue ? '1px solid var(--danger)' : '1px solid var(--border-color)',
                    borderLeftWidth: '5px',
                    borderLeftColor: isOverdue ? 'var(--danger)' : 'var(--warning)',
                  }}
                >
                  <div className="reminder-header">
                    <div>
                      <div className="reminder-company">{app.company}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{app.role}</div>
                    </div>
                    <span
                      className={`reminder-tag ${isOverdue ? 'overdue' : 'upcoming'}`}
                      style={{
                        backgroundColor: isOverdue ? 'var(--danger)' : 'var(--warning-subtle)',
                        color: isOverdue ? '#ffffff' : '#fbbf24',
                      }}
                    >
                      {isOverdue ? 'OVERDUE' : 'UPCOMING'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: isOverdue ? '#f87171' : '#fbbf24', fontWeight: '600' }}>
                    📅 {isOverdue ? 'Was due:' : 'Due:'} {formatDate(app.followUpDate)}
                  </div>

                  {app.followUpNote ? (
                    <div className="reminder-note">"{app.followUpNote}"</div>
                  ) : (
                    <div className="reminder-note" style={{ color: 'var(--text-muted)' }}>No follow-up notes</div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <Link
                      to={`/applications/${app._id}/edit`}
                      style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                    >
                      Edit Application →
                    </Link>

                    {/* Mark Done button */}
                    <button
                      className="btn-mark-done"
                      disabled={isBusy}
                      onClick={() => handleMarkDone(app._id, app.company)}
                      title="Clear this follow-up reminder"
                    >
                      {isBusy ? 'Saving...' : '✓ Mark done'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
