import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import applicationApi from '../api/applications';
import toast from 'react-hot-toast';

const STAGE_ORDER = ['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, followUpsRes] = await Promise.all([
        applicationApi.getStatsSummary(),
        applicationApi.getUpcomingFollowUps(7),
      ]);
      setStats(statsRes?.data || null);
      setFollowUps(followUpsRes?.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard metrics...</p>
      </div>
    );
  }

  const overdueFollowUps = followUps.filter((f) => f.overdue || f.isOverdue);
  const upcomingFollowUps = followUps.filter((f) => !f.overdue && !f.isOverdue);

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Personal internship pipeline overview & priority reminders</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/applications" className="btn-secondary">
            View All Applications
          </Link>
          <Link to="/applications/new" className="btn-primary">
            + New Application
          </Link>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <section style={{ marginBottom: '28px' }}>
        <div className="stats-grid">
          {/* Total card */}
          <div
            className="stat-card"
            onClick={() => navigate('/applications')}
            title="Click to view all applications"
          >
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats?.total || 0}</span>
          </div>

          {/* Per Stage cards */}
          {STAGE_ORDER.map((stage) => {
            const count = stats?.byStage?.[stage] || 0;
            const badgeClass = stage.replace(/[^a-zA-Z]/g, '');
            return (
              <div
                key={stage}
                className="stat-card"
                onClick={() => navigate(`/applications?stage=${encodeURIComponent(stage)}`)}
                title={`Filter by ${stage}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="stat-label">{stage}</span>
                  <span className={`stage-badge ${badgeClass}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                    ●
                  </span>
                </div>
                <span className="stat-value">{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Deadlines Banner (if any) */}
      {stats?.upcomingDeadlinesCount > 0 && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>⏰</span>
          <div>
            <strong style={{ color: '#fbbf24' }}>
              {stats.upcomingDeadlinesCount} application deadline(s) upcoming in the next 7 days!
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Check your pending applications and make sure submissions are finalized on time.
            </p>
          </div>
        </div>
      )}

      {/* Overdue Follow-ups Section */}
      {overdueFollowUps.length > 0 && (
        <section className="banner-card" style={{ borderLeft: '4px solid var(--danger)', marginBottom: '24px' }}>
          <div className="banner-title" style={{ color: '#f87171' }}>
            <span>⚠️</span>
            <span>Overdue Follow-ups ({overdueFollowUps.length})</span>
          </div>
          <div className="banner-grid">
            {overdueFollowUps.map((app) => (
              <div key={app._id} className="reminder-item overdue">
                <div className="reminder-header">
                  <div>
                    <div className="reminder-company">{app.company}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{app.role}</div>
                  </div>
                  <span className="reminder-tag overdue">Overdue</span>
                </div>
                {app.followUpNote && (
                  <div className="reminder-note">"{app.followUpNote}"</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '600' }}>
                    Due: {formatDate(app.followUpDate)}
                  </span>
                  <Link
                    to={`/applications/${app._id}/edit`}
                    className="btn-icon"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    Update →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Follow-ups (Next 7 days) */}
      <section className="banner-card">
        <div className="banner-title">
          <span>🔔</span>
          <span>Upcoming Follow-ups (Next 7 Days)</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'normal' }}>
            ({upcomingFollowUps.length})
          </span>
        </div>

        {upcomingFollowUps.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '10px 0' }}>
            No upcoming follow-ups scheduled for the next 7 days.
          </p>
        ) : (
          <div className="banner-grid">
            {upcomingFollowUps.map((app) => (
              <div key={app._id} className="reminder-item upcoming">
                <div className="reminder-header">
                  <div>
                    <div className="reminder-company">{app.company}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{app.role}</div>
                  </div>
                  <span className="reminder-tag upcoming">Upcoming</span>
                </div>
                {app.followUpNote && (
                  <div className="reminder-note">"{app.followUpNote}"</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '600' }}>
                    Follow-up: {formatDate(app.followUpDate)}
                  </span>
                  <Link
                    to={`/applications/${app._id}/edit`}
                    className="btn-icon"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    View / Edit →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
