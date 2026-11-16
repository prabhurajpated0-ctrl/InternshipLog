import React from 'react';

const STAGE_COLORS = {
  Wishlist: '#94a3b8',
  Applied: '#3b82f6',
  'OA/Screening': '#8b5cf6',
  Interview: '#f59e0b',
  Offer: '#10b981',
  Rejected: '#ef4444',
};

export default function StatsBanner({ stats, activeStage, onSelectStage }) {
  if (!stats) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '12px',
      marginBottom: '24px'
    }}>
      <div
        onClick={() => onSelectStage('')}
        style={{
          background: activeStage === '' ? '#1e3a8a' : '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Total</span>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{stats.total || 0}</div>
      </div>

      {stats.byStage && Object.entries(stats.byStage).map(([stg, count]) => (
        <div
          key={stg}
          onClick={() => onSelectStage(activeStage === stg ? '' : stg)}
          style={{
            background: activeStage === stg ? '#334155' : '#1e293b',
            border: `1px solid ${activeStage === stg ? STAGE_COLORS[stg] || '#64748b' : '#334155'}`,
            borderRadius: '8px',
            padding: '12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: '11px', color: STAGE_COLORS[stg] || '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
            {stg}
          </span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{count}</div>
        </div>
      ))}
    </div>
  );
}
