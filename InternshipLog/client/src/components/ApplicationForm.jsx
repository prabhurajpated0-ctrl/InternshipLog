import React, { useState, useEffect } from 'react';

const STAGES = ['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'];

export default function ApplicationForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    stage: 'Applied',
    deadline: '',
    appliedDate: new Date().toISOString().split('T')[0],
    followUpDate: '',
    followUpNote: '',
    location: '',
    link: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        company: initialData.company || '',
        role: initialData.role || '',
        stage: initialData.stage || 'Applied',
        deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
        appliedDate: initialData.appliedDate ? initialData.appliedDate.split('T')[0] : '',
        followUpDate: initialData.followUpDate ? initialData.followUpDate.split('T')[0] : '',
        followUpNote: initialData.followUpNote || '',
        location: initialData.location || '',
        link: initialData.link || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.company.trim() || !formData.role.trim()) {
      setError('Company and Role are required.');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px'
    }}>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', color: '#f8fafc' }}>
        {initialData ? 'Edit Application' : 'Add New Application'}
      </h3>

      {error && (
        <div style={{
          background: '#450a0a',
          color: '#f87171',
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Company *
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            required
            placeholder="e.g. Google, Stripe"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Role *
          </label>
          <input
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            placeholder="e.g. Software Engineer Intern"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Stage
          </label>
          <select
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Applied Date
          </label>
          <input
            type="date"
            name="appliedDate"
            value={formData.appliedDate}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Deadline
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. Remote / New York, NY"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Application / Job Link
          </label>
          <input
            type="url"
            name="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Follow-Up Date
          </label>
          <input
            type="date"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
            Follow-Up Note
          </label>
          <input
            type="text"
            name="followUpNote"
            value={formData.followUpNote}
            onChange={handleChange}
            placeholder="e.g. Email recruiter if no response"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              background: '#0f172a',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '18px' }}>
        <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
          Notes
        </label>
        <textarea
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          placeholder="Interview prep notes, recruiter contacts, referral info..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #475569',
            background: '#0f172a',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: '#334155',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              color: '#f8fafc',
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#3b82f6',
            border: 'none',
            padding: '8px 20px',
            borderRadius: '6px',
            color: '#fff',
            fontWeight: '600',
          }}
        >
          {loading ? 'Saving...' : initialData ? 'Update Application' : 'Save Application'}
        </button>
      </div>
    </form>
  );
}
