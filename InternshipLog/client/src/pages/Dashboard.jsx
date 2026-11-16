import React, { useState } from 'react';
import { useApplications } from '../hooks/useApplications';
import StatsBanner from '../components/StatsBanner';
import UpcomingFollowUps from '../components/UpcomingFollowUps';
import ApplicationCard from '../components/ApplicationCard';
import ApplicationForm from '../components/ApplicationForm';

export default function Dashboard() {
  const {
    applications,
    stats,
    upcomingFollowUps,
    loading,
    error,
    stageFilter,
    setStageFilter,
    searchQuery,
    setSearchQuery,
    addApplication,
    updateApplication,
    deleteApplication,
  } = useApplications();

  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  const handleCreate = async (data) => {
    await addApplication(data);
    setShowForm(false);
  };

  const handleUpdate = async (data) => {
    if (editingApp) {
      await updateApplication(editingApp._id, data);
      setEditingApp(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      await deleteApplication(id);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#f8fafc' }}>
            🎓 InternshipLog
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Track and manage your internship & job applications
          </p>
        </div>

        <button
          onClick={() => {
            setEditingApp(null);
            setShowForm((prev) => !prev);
          }}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {showForm ? 'Close Form' : '+ Add Application'}
        </button>
      </header>

      {/* Summary Stats */}
      <StatsBanner
        stats={stats}
        activeStage={stageFilter}
        onSelectStage={setStageFilter}
      />

      {/* Upcoming follow-ups */}
      <UpcomingFollowUps
        followUps={upcomingFollowUps}
        onSelectApplication={(app) => {
          setEditingApp(app);
          setShowForm(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Add / Edit Form */}
      {(showForm || editingApp) && (
        <ApplicationForm
          initialData={editingApp}
          onSubmit={editingApp ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingApp(null);
          }}
        />
      )}

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <input
          type="text"
          placeholder="Search company, role, location, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1',
            minWidth: '220px',
            padding: '10px 14px',
            borderRadius: '6px',
            border: '1px solid #334155',
            background: '#1e293b',
            color: '#f8fafc',
          }}
        />

        {stageFilter && (
          <button
            onClick={() => setStageFilter('')}
            style={{
              background: '#334155',
              border: 'none',
              padding: '10px 14px',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '13px',
            }}
          >
            Clear Filter: <strong>{stageFilter}</strong> ✕
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: '#450a0a',
          color: '#f87171',
          padding: '14px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !applications.length && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading applications...
        </div>
      )}

      {/* Applications list */}
      {!loading && applications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#1e293b',
          borderRadius: '8px',
          border: '1px dashed #334155',
        }}>
          <h3 style={{ color: '#cbd5e1', fontSize: '18px', marginBottom: '8px' }}>
            No applications found
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
            {stageFilter || searchQuery ? 'Try clearing your filters or search.' : 'Get started by tracking your first application!'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '600',
            }}
          >
            + Add First Application
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {applications.map((app) => (
            <ApplicationCard
              key={app._id}
              application={app}
              onEdit={(appToEdit) => {
                setEditingApp(appToEdit);
                setShowForm(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
