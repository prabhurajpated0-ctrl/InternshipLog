import React from 'react';

const STAGE_COLORS = {
  Wishlist: { bg: '#334155', text: '#cbd5e1' },
  Applied: { bg: '#1e3a8a', text: '#93c5fd' },
  'OA/Screening': { bg: '#581c87', text: '#d8b4fe' },
  Interview: { bg: '#78350f', text: '#fde68a' },
  Offer: { bg: '#064e3b', text: '#6ee7b7' },
  Rejected: { bg: '#7f1d1d', text: '#fca5a5' },
};

export default function ApplicationCard({ application, onEdit, onDelete, onUpdateStage }) {
  const stageStyle = STAGE_COLORS[application.stage] || { bg: '#334155', text: '#cbd5e1' };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#f8fafc' }}>
            {application.company}
          </h4>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '2px' }}>
            {application.role}
          </p>
        </div>

        <span style={{
          background: stageStyle.bg,
          color: stageStyle.text,
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: '600',
        }}>
          {application.stage}
        </span>
      </div>

      {application.location && (
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>
          📍 {application.location}
        </div>
      )}

      {application.notes && (
        <p style={{ fontSize: '13px', color: '#cbd5e1', background: '#0f172a', padding: '8px 12px', borderRadius: '6px' }}>
          {application.notes}
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
        {application.appliedDate && (
          <span style={{ color: '#94a3b8' }}>
            Applied: <strong>{formatDate(application.appliedDate)}</strong>
          </span>
        )}
        {application.deadline && (
          <span style={{ color: '#f59e0b' }}>
            ⏰ Deadline: <strong>{formatDate(application.deadline)}</strong>
          </span>
        )}
        {application.followUpDate && (
          <span style={{ color: '#818cf8' }}>
            🔔 Follow-up: <strong>{formatDate(application.followUpDate)}</strong>
            {application.followUpNote && ` (${application.followUpNote})`}
          </span>
        )}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #334155',
        paddingTop: '12px',
        marginTop: 'auto',
      }}>
        <div>
          {application.link && (
            <a
              href={application.link.startsWith('http') ? application.link : `https://${application.link}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '13px' }}
            >
              🔗 Job Post
            </a>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onEdit(application)}
            style={{
              background: '#334155',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(application._id)}
            style={{
              background: '#7f1d1d',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              color: '#fca5a5',
              fontSize: '12px',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
