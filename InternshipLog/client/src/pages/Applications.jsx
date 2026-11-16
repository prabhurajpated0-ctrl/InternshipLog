import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import applicationApi from '../api/applications';
import toast from 'react-hot-toast';

const STAGES = ['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'];

export default function Applications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStageParam = searchParams.get('stage') || '';

  const [applications, setApplications] = useState([]);
  const [stageCounts, setStageCounts] = useState({});
  const [selectedStage, setSelectedStage] = useState(currentStageParam);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Delete confirmation modal state
  const [deleteModalApp, setDeleteModalApp] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Synchronize stage tab with URL parameter
  useEffect(() => {
    setSelectedStage(currentStageParam);
  }, [currentStageParam]);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStage) params.stage = selectedStage;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const [appsRes, statsRes] = await Promise.all([
        applicationApi.getAll(params),
        applicationApi.getStatsSummary().catch(() => null),
      ]);

      setApplications(appsRes?.data || []);
      if (statsRes?.data?.byStage) {
        setStageCounts({
          total: statsRes.data.total || 0,
          ...statsRes.data.byStage,
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [selectedStage, debouncedSearch]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleStageTabClick = (stage) => {
    setSelectedStage(stage);
    if (stage) {
      setSearchParams({ stage });
    } else {
      setSearchParams({});
    }
  };

  // Quick Stage Change per row/card
  const handleQuickStageChange = async (appId, newStage, currentCompany) => {
    try {
      await applicationApi.update(appId, { stage: newStage });
      toast.success(`${currentCompany} stage changed to ${newStage}`);

      // Optimistically update list
      setApplications((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, stage: newStage } : app))
      );

      // Refresh stats in background
      applicationApi.getStatsSummary().then((res) => {
        if (res?.data?.byStage) {
          setStageCounts({
            total: res.data.total || 0,
            ...res.data.byStage,
          });
        }
      });
    } catch (err) {
      toast.error(err.message || 'Failed to update stage');
    }
  };

  // Delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteModalApp) return;

    try {
      setDeleting(true);
      await applicationApi.delete(deleteModalApp._id);
      toast.success(`Application for ${deleteModalApp.company} deleted.`);

      setApplications((prev) => prev.filter((a) => a._id !== deleteModalApp._id));
      setDeleteModalApp(null);

      // Update total count
      setStageCounts((prev) => ({
        ...prev,
        total: Math.max(0, (prev.total || 1) - 1),
        [deleteModalApp.stage]: Math.max(0, (prev[deleteModalApp.stage] || 1) - 1),
      }));
    } catch (err) {
      toast.error(err.message || 'Failed to delete application');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
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
          <p className="page-subtitle">Manage submissions, update interview stages, and track progress</p>
        </div>
        <Link to="/applications/new" className="btn-primary">
          + Add Application
        </Link>
      </div>

      {/* Stage Filter Tabs */}
      <div className="stage-tabs-container">
        <button
          className={`stage-tab ${selectedStage === '' ? 'active' : ''}`}
          onClick={() => handleStageTabClick('')}
        >
          All Applications
          {stageCounts.total !== undefined && (
            <span className="tab-count">{stageCounts.total}</span>
          )}
        </button>

        {STAGES.map((stg) => {
          const count = stageCounts[stg];
          return (
            <button
              key={stg}
              className={`stage-tab ${selectedStage === stg ? 'active' : ''}`}
              onClick={() => handleStageTabClick(stg)}
            >
              <span>{stg}</span>
              {count !== undefined && <span className="tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search and Filter Controls */}
      <div className="controls-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search company, role, location, notes (debounced)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm && (
          <button
            className="btn-icon"
            onClick={() => setSearchTerm('')}
            title="Clear search"
          >
            Clear Search ✕
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="table-wrapper skeleton" style={{ height: '360px', display: 'block' }} />
      ) : applications.length === 0 ? (
        /* Empty State */
        <div className="empty-state">
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
          <h3 className="empty-title">No applications found</h3>
          <p className="empty-desc">
            {selectedStage || debouncedSearch
              ? 'Try broadening your search query or selecting another stage tab.'
              : 'You have not added any internship applications yet.'}
          </p>
          <Link to="/applications/new" className="btn-primary">
            + Add New Application
          </Link>
        </div>
      ) : (
        <>
          {/* =============================================================
              1. Desktop View: Responsive Table
              ============================================================= */}
          <div className="table-wrapper">
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Company & Role</th>
                  <th>Stage</th>
                  <th>Applied Date</th>
                  <th>Deadline</th>
                  <th>Follow-up</th>
                  <th>Job Post</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const badgeClass = app.stage ? app.stage.replace(/[^a-zA-Z]/g, '') : 'Applied';
                  return (
                    <tr key={app._id}>
                      {/* Company & Role */}
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {app.company}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {app.role} {app.location && `• 📍 ${app.location}`}
                        </div>
                      </td>

                      {/* Stage Badge & Quick Dropdown */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`stage-badge ${badgeClass}`}>
                            {app.stage}
                          </span>
                          <select
                            className="stage-select"
                            value={app.stage}
                            onChange={(e) => handleQuickStageChange(app._id, e.target.value, app.company)}
                            title="Quick change stage"
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td>{formatDate(app.appliedDate)}</td>

                      {/* Deadline */}
                      <td>
                        {app.deadline ? (
                          <span style={{ color: '#fbbf24', fontWeight: '500' }}>
                            {formatDate(app.deadline)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Follow-up */}
                      <td>
                        {app.followUpDate ? (
                          <div>
                            <span style={{ color: '#818cf8', fontWeight: '500' }}>
                              {formatDate(app.followUpDate)}
                            </span>
                            {app.followUpNote && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {app.followUpNote}
                              </div>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Job Link */}
                      <td>
                        {app.link ? (
                          <a
                            href={app.link.startsWith('http') ? app.link : `https://${app.link}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: '12px' }}
                          >
                            View Post ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Link to={`/applications/${app._id}/edit`} className="btn-icon">
                            Edit
                          </Link>
                          <button
                            onClick={() => setDeleteModalApp(app)}
                            className="btn-icon danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* =============================================================
              2. Mobile View: Responsive Cards
              ============================================================= */}
          <div className="mobile-cards-view">
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
                    {/* Quick Stage Change on mobile */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Change Stage:</span>
                      <select
                        className="stage-select"
                        value={app.stage}
                        onChange={(e) => handleQuickStageChange(app._id, e.target.value, app.company)}
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {app.location && (
                      <div className="app-meta-row">
                        <span>📍</span>
                        <span>{app.location}</span>
                      </div>
                    )}

                    {app.appliedDate && (
                      <div className="app-meta-row">
                        <span>📅 Applied:</span>
                        <span>{formatDate(app.appliedDate)}</span>
                      </div>
                    )}

                    {app.deadline && (
                      <div className="app-meta-row" style={{ color: '#fbbf24' }}>
                        <span>⏰ Deadline:</span>
                        <span>{formatDate(app.deadline)}</span>
                      </div>
                    )}

                    {app.followUpDate && (
                      <div className="app-meta-row" style={{ color: '#818cf8' }}>
                        <span>🔔 Follow-up:</span>
                        <span>
                          {formatDate(app.followUpDate)}
                          {app.followUpNote && ` (${app.followUpNote})`}
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
                          style={{ fontSize: '12px' }}
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
                        onClick={() => setDeleteModalApp(app)}
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
        </>
      )}

      {/* =============================================================
          3. Delete Confirmation Modal
          ============================================================= */}
      {deleteModalApp && (
        <div className="modal-backdrop" onClick={() => !deleting && setDeleteModalApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Application?</h3>
            <p className="modal-body">
              Are you sure you want to delete your application for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>
                {deleteModalApp.company} ({deleteModalApp.role})
              </strong>?{' '}
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                disabled={deleting}
                onClick={() => setDeleteModalApp(null)}
              >
                Cancel
              </button>
              <button
                className="btn-icon danger"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                disabled={deleting}
                onClick={handleConfirmDelete}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
