import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const STAGES = ['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'];

export default function ApplicationForm({
  initialData = null,
  onSubmit,
  onCancel,
  isEditing = false,
}) {
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

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

    // Clear field-specific error as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  // Client-side validation mirroring express-validator backend rules
  const validateClientSide = () => {
    const errors = {};

    // 1. Company
    if (!formData.company || !formData.company.trim()) {
      errors.company = 'Company is required';
    } else if (formData.company.trim().length > 100) {
      errors.company = 'Company name cannot exceed 100 characters';
    }

    // 2. Role
    if (!formData.role || !formData.role.trim()) {
      errors.role = 'Role is required';
    } else if (formData.role.trim().length > 100) {
      errors.role = 'Role title cannot exceed 100 characters';
    }

    // 3. Stage
    if (formData.stage && !STAGES.includes(formData.stage)) {
      errors.stage = `Stage must be one of: ${STAGES.join(', ')}`;
    }

    // 4. Dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (formData.deadline && !dateRegex.test(formData.deadline)) {
      errors.deadline = 'Deadline must be a valid date';
    }
    if (formData.appliedDate && !dateRegex.test(formData.appliedDate)) {
      errors.appliedDate = 'Applied date must be a valid date';
    }
    if (formData.followUpDate && !dateRegex.test(formData.followUpDate)) {
      errors.followUpDate = 'Follow-up date must be a valid date';
    }

    // 5. Link
    if (formData.link && formData.link.trim()) {
      const trimmedLink = formData.link.trim();
      if (trimmedLink.length > 500) {
        errors.link = 'Link cannot exceed 500 characters';
      } else {
        try {
          const testUrl = trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://')
            ? trimmedLink
            : `https://${trimmedLink}`;
          new URL(testUrl);
        } catch {
          errors.link = 'Link must be a valid URL';
        }
      }
    }

    // 6. Limits
    if (formData.location && formData.location.length > 100) {
      errors.location = 'Location cannot exceed 100 characters';
    }
    if (formData.followUpNote && formData.followUpNote.length > 300) {
      errors.followUpNote = 'Follow-up note cannot exceed 300 characters';
    }
    if (formData.notes && formData.notes.length > 2000) {
      errors.notes = 'Notes cannot exceed 2000 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateClientSide()) {
      toast.error('Please fix the validation errors before submitting.');
      return;
    }

    try {
      setSubmitting(true);

      // Clean empty dates to null for MongoDB ISO storage
      const payload = {
        company: formData.company.trim(),
        role: formData.role.trim(),
        stage: formData.stage,
        deadline: formData.deadline || null,
        appliedDate: formData.appliedDate || null,
        followUpDate: formData.followUpDate || null,
        followUpNote: formData.followUpNote.trim(),
        location: formData.location.trim(),
        link: formData.link.trim(),
        notes: formData.notes.trim(),
      };

      await onSubmit(payload);
    } catch (err) {
      // Map server-side validation errors if provided by API
      if (err.errors && Array.isArray(err.errors)) {
        const mappedErrors = {};
        err.errors.forEach((e) => {
          if (e.field) mappedErrors[e.field] = e.message;
        });
        setFieldErrors(mappedErrors);
      }
      setServerError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* General Server Error Banner */}
      {serverError && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          color: '#f87171',
          fontSize: '13px',
          marginBottom: '20px',
        }}>
          <strong>Error: </strong> {serverError}
        </div>
      )}

      {/* Row 1: Company & Role */}
      <div className="form-grid two-cols" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="company">
            Company <span className="required">*</span>
          </label>
          <input
            id="company"
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="e.g. Google, Stripe, Microsoft"
            maxLength={100}
            style={{ borderColor: fieldErrors.company ? 'var(--danger)' : undefined }}
          />
          {fieldErrors.company && (
            <span className="form-error-msg">{fieldErrors.company}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="role">
            Role / Position Title <span className="required">*</span>
          </label>
          <input
            id="role"
            type="text"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="e.g. Software Engineer Intern"
            maxLength={100}
            style={{ borderColor: fieldErrors.role ? 'var(--danger)' : undefined }}
          />
          {fieldErrors.role && (
            <span className="form-error-msg">{fieldErrors.role}</span>
          )}
        </div>
      </div>

      {/* Row 2: Stage, Applied Date, Deadline */}
      <div className="form-grid three-cols" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="stage">Stage</label>
          <select
            id="stage"
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            style={{ borderColor: fieldErrors.stage ? 'var(--danger)' : undefined }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {fieldErrors.stage && (
            <span className="form-error-msg">{fieldErrors.stage}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="appliedDate">Date Applied</label>
          <input
            id="appliedDate"
            type="date"
            name="appliedDate"
            value={formData.appliedDate}
            onChange={handleChange}
            style={{ borderColor: fieldErrors.appliedDate ? 'var(--danger)' : undefined }}
          />
          {fieldErrors.appliedDate && (
            <span className="form-error-msg">{fieldErrors.appliedDate}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="deadline">Deadline</label>
          <input
            id="deadline"
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            style={{ borderColor: fieldErrors.deadline ? 'var(--danger)' : undefined }}
          />
          {fieldErrors.deadline && (
            <span className="form-error-msg">{fieldErrors.deadline}</span>
          )}
        </div>
      </div>

      {/* Row 3: Location & Link */}
      <div className="form-grid two-cols" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g. San Francisco, CA / Remote"
            maxLength={100}
            style={{ borderColor: fieldErrors.location ? 'var(--danger)' : undefined }}
          />
          {fieldErrors.location && (
            <span className="form-error-msg">{fieldErrors.location}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="link">Application / Job Post URL</label>
          <input
            id="link"
            type="url"
            name="link"
            value={formData.link}
            onChange={handleChange}
            placeholder="https://company.com/jobs/123"
            maxLength={500}
            style={{ borderColor: fieldErrors.link ? 'var(--danger)' : undefined }}
          />
          {fieldErrors.link && (
            <span className="form-error-msg">{fieldErrors.link}</span>
          )}
        </div>
      </div>

      {/* Row 4: Follow-up Date & Note */}
      <div className="form-grid two-cols" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="followUpDate">Follow-up Date</label>
          <input
            id="followUpDate"
            type="date"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleChange}
            style={{ borderColor: fieldErrors.followUpDate ? 'var(--danger)' : undefined }}
          />
          {fieldErrors.followUpDate && (
            <span className="form-error-msg">{fieldErrors.followUpDate}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="followUpNote">Follow-up Note</label>
          <input
            id="followUpNote"
            type="text"
            name="followUpNote"
            value={formData.followUpNote}
            onChange={handleChange}
            placeholder="e.g. Email recruiter for update on assessment"
            maxLength={300}
            style={{ borderColor: fieldErrors.followUpNote ? 'var(--danger)' : undefined }}
          />
          {fieldErrors.followUpNote && (
            <span className="form-error-msg">{fieldErrors.followUpNote}</span>
          )}
        </div>
      </div>

      {/* Row 5: Notes */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="form-label" htmlFor="notes">Notes & Prep Details</label>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formData.notes.length}/2000
          </span>
        </div>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes}
          onChange={handleChange}
          placeholder="Referral contacts, interview topics, interviewers, feedback notes..."
          maxLength={2000}
          style={{ borderColor: fieldErrors.notes ? 'var(--danger)' : undefined }}
        />
        {fieldErrors.notes && (
          <span className="form-error-msg">{fieldErrors.notes}</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting}
        >
          {submitting
            ? 'Saving...'
            : isEditing
            ? 'Save Changes'
            : 'Create Application'}
        </button>
      </div>
    </form>
  );
}
