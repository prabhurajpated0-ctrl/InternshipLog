import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import applicationApi from '../api/applications';
import toast from 'react-hot-toast';

const STAGES = ['Wishlist', 'Applied', 'OA/Screening', 'Interview', 'Offer', 'Rejected'];

export default function ApplicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

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

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      const fetchApp = async () => {
        try {
          setFetching(true);
          const res = await applicationApi.getById(id);
          const app = res?.data;
          if (app) {
            setFormData({
              company: app.company || '',
              role: app.role || '',
              stage: app.stage || 'Applied',
              deadline: app.deadline ? app.deadline.split('T')[0] : '',
              appliedDate: app.appliedDate ? app.appliedDate.split('T')[0] : '',
              followUpDate: app.followUpDate ? app.followUpDate.split('T')[0] : '',
              followUpNote: app.followUpNote || '',
              location: app.location || '',
              link: app.link || '',
              notes: app.notes || '',
            });
          }
        } catch (err) {
          toast.error(err.message || 'Failed to load application details');
          navigate('/applications');
        } finally {
          setFetching(false);
        }
      };
      fetchApp();
    }
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.company.trim()) errors.company = 'Company is required';
    if (!formData.role.trim()) errors.role = 'Role is required';
    if (formData.company.length > 100) errors.company = 'Company cannot exceed 100 characters';
    if (formData.role.length > 100) errors.role = 'Role cannot exceed 100 characters';
    if (formData.link && !formData.link.startsWith('http://') && !formData.link.startsWith('https://')) {
      // Helpful prefix if missing
      formData.link = `https://${formData.link}`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      // Clean empty dates to null so backend handles cleanly
      const payload = {
        ...formData,
        deadline: formData.deadline || null,
        appliedDate: formData.appliedDate || null,
        followUpDate: formData.followUpDate || null,
      };

      if (isEditing) {
        await applicationApi.update(id, payload);
        toast.success(`Application for ${formData.company} updated!`);
      } else {
        await applicationApi.create(payload);
        toast.success(`Application for ${formData.company} added!`);
      }
      navigate('/applications');
    } catch (err) {
      toast.error(err.message || 'Failed to save application');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading application details...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header" style={{ maxWidth: '720px', margin: '0 auto 20px auto' }}>
        <div>
          <h1 className="page-title">{isEditing ? 'Edit Application' : 'New Application'}</h1>
          <p className="page-subtitle">
            {isEditing ? `Updating submission details for ${formData.company || 'application'}` : 'Add a new internship or job application to your tracker'}
          </p>
        </div>
        <Link to="/applications" className="btn-secondary">
          ← Back
        </Link>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {/* Company & Role */}
          <div className="form-grid two-cols" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">
                Company <span className="required">*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g. Google, Stripe, Microsoft"
                required
              />
              {fieldErrors.company && <span className="form-error-msg">{fieldErrors.company}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Role / Title <span className="required">*</span>
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g. Software Engineer Intern"
                required
              />
              {fieldErrors.role && <span className="form-error-msg">{fieldErrors.role}</span>}
            </div>
          </div>

          {/* Stage, Applied Date, Deadline */}
          <div className="form-grid three-cols" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Stage</label>
              <select name="stage" value={formData.stage} onChange={handleChange}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date Applied</label>
              <input
                type="date"
                name="appliedDate"
                value={formData.appliedDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location & Job Link */}
          <div className="form-grid two-cols" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. San Francisco, CA / Remote"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Posting / Application Link</label>
              <input
                type="text"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://company.com/jobs/123"
              />
            </div>
          </div>

          {/* Follow-up Date & Note */}
          <div className="form-grid two-cols" style={{ marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Follow-up Note</label>
              <input
                type="text"
                name="followUpNote"
                value={formData.followUpNote}
                onChange={handleChange}
                placeholder="e.g. Email recruiter if no response"
                maxLength={300}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Notes & Interview Details</label>
            <textarea
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Referral contact, tech stack, interview prep topics, feedback..."
              maxLength={2000}
            />
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/applications')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
