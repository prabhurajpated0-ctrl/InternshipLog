import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import applicationApi from '../api/applications';
import ApplicationForm from '../components/ApplicationForm';
import toast from 'react-hot-toast';

export default function ApplicationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      const loadApp = async () => {
        try {
          setLoading(true);
          const res = await applicationApi.getById(id);
          if (res?.data) {
            setInitialData(res.data);
          } else {
            toast.error('Application not found');
            navigate('/applications');
          }
        } catch (err) {
          toast.error(err.message || 'Failed to fetch application');
          navigate('/applications');
        } finally {
          setLoading(false);
        }
      };
      loadApp();
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (payload) => {
    if (isEditing) {
      await applicationApi.update(id, payload);
      toast.success(`Application for ${payload.company} updated successfully!`);
    } else {
      await applicationApi.create(payload);
      toast.success(`Application for ${payload.company} created successfully!`);
    }
    navigate('/applications');
  };

  if (loading) {
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
            {isEditing
              ? `Updating submission details for ${initialData?.company || 'application'}`
              : 'Add a new internship or job application to your tracker'}
          </p>
        </div>
        <Link to="/applications" className="btn-secondary">
          ← Back
        </Link>
      </div>

      <div className="form-card">
        <ApplicationForm
          initialData={initialData}
          isEditing={isEditing}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/applications')}
        />
      </div>
    </div>
  );
}
