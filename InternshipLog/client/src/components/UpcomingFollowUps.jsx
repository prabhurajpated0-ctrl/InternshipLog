import React from 'react';

export default function UpcomingFollowUps({ followUps, onSelectApplication }) {
  if (!followUps || followUps.length === 0) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={{
      background: '#172554',
      border: '1px solid #1e40af',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px' }}>🔔</span>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#bfdbfe' }}>
          Upcoming Follow-ups ({followUps.length})
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
        {followUps.map((app) => (
          <div
            key={app._id}
            onClick={() => onSelectApplication && onSelectApplication(app)}
            style={{
              background: '#1e293b',
              border: '1px solid #2563eb',
              borderRadius: '6px',
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '14px' }}>
                {app.company}
              </span>
              <span style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 'bold' }}>
                {formatDate(app.followUpDate)}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {app.role}
            </p>
            {app.followUpNote && (
              <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', fontStyle: 'italic' }}>
                "{app.followUpNote}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
