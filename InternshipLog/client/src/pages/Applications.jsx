import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import applicationApi from '../api/applications';
import toast from 'react-hot-toast';

const STAGES = ['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'];

export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStage = searchParams.get('stage') || '';

  const [applications, setApplications] = useState([]);
  const [selectedStage, setSelectedStage] = useState(initialStage);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStage) params.stage = selectedStage;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await applicationApi.getAll(params);
      setApplications(res?.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [selectedStage, searchQuery]);

  const handleStageChange = (stage) => {
    setSelectedStage(stage);
    if (stage) {
      setSearchParams({ stage });
    } else {
      setSearchParams({});
    }
  };

  const handleDelete = async (id, company) => {
    if (!window.confirm(`Are you sure you want to delete the application for ${company}?`)) {
      return;
    }

    try {
      await applicationApi.delete(id);
      toast.success(`Application for ${company} removed.`);
      setApplications((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete application');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">Track, filter, and update all your job and internship submissions</p>
        </div>
        <Link to="/applications/new" className="btn-primary">
          + Add Application
        </Link>
      </div>

      {/* Controls Bar */}
      <div className="controls-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search company, role, location, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="filter-select"
            value={selectedStage}
            onChange={(e) => handleStageChange(e.target.value)}
          >
            <option value="">All Stages ({applications.length})</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {selectedStage && (
            <button
              onClick={() => handleStageChange('')}
              className="btn-icon"
              title="Clear stage filter"
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-title">No applications found</h3>
          <p className="empty-desc">
            {selectedStage || searchQuery
              ? 'Try adjusting your search criteria or clearing your filters.'
              : 'Start building your internship log by adding your first application!'}
          </p>
          <Link to="/applications/new" className="btn-primary">
            + Add First Application
          </Link>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((app) => {
            const badgeClass = app.stage ? app.stage.replace(/[^a-zA-Z]/g, '') : 'Applied';
            return (
              <div key={app._id} className="app-card">
                <div className="app-card-header">
                  <div>
                    <h3 className="app-card-title">{app.company}</h3>
                    <p className="app-card-role">{app.role}</p>
                  </div>
                  <span className={`stage-badge ${badgeClass}`}>{app.stage}</span>
                </div>

                <div className="app-card-body">
                  {app.location && (
                    <div className="app-meta-row">
                      <span>📍</span>
                      <span>{app.location}</span>
                    </div>
                  )}

                  {app.appliedDate && (
                    <div className="app-meta-row">
                      <span>📅</span>
                      <span>Applied: {formatDate(app.appliedDate)}</span>
                    </div>
                  )}

                  {app.deadline && (
                    <div className="app-meta-row" style={{ color: '#fbbf24' }}>
                      <span>⏰</span>
                      <span>Deadline: {formatDate(app.deadline)}</span>
                    </div>
                  )}

                  {app.followUpDate && (
                    <div className="app-meta-row" style={{ color: '#818cf8' }}>
                      <span>🔔</span>
                      <span>
                        Follow-up: {formatDate(app.followUpDate)}
                        {app.followUpNote ? ` (${app.followUpNote})` : ''}
                      </span>
                    </div>
                  )}

                  {app.notes && (
                    <div className="app-notes-box">
                      {app.notes}
                    </div>
                  )}
                </div>

                <div className="app-card-footer">
                  <div>
                    {app.link ? (
                      <a
                        href={app.link.startsWith('http') ? app.link : `https://${app.link}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '12px', fontWeight: '500' }}
                      >
                        🔗 Job Post ↗
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No link</span>
                    )}
                  </div>

                  <div className="action-buttons">
                    <Link to={`/applications/${app._id}/edit`} className="btn-icon">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(app._id, app.company)}
                      className="btn-icon danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
