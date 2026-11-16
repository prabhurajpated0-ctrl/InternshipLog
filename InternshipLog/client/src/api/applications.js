import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Centralized error message extractor
const handleError = (error) => {
  if (error.response) {
    // Backend responded with HTTP 4xx or 5xx
    const data = error.response.data;
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const fieldErrors = data.errors.map((e) => e.message).join(' | ');
      throw new Error(fieldErrors);
    }
    throw new Error(data.message || `Request failed with status ${error.response.status}`);
  } else if (error.request) {
    // Request made but no response (server unreachable)
    throw new Error('Server unreachable. Please verify the backend server is running on port 5000.');
  } else {
    throw new Error(error.message || 'An unexpected error occurred.');
  }
};

export const applicationApi = {
  // GET /api/applications?stage=&search=
  getAll: async (params = {}) => {
    try {
      const res = await api.get('/applications', { params });
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  // GET /api/applications/:id
  getById: async (id) => {
    try {
      const res = await api.get(`/applications/${id}`);
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  // POST /api/applications
  create: async (applicationData) => {
    try {
      const res = await api.post('/applications', applicationData);
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  // PUT /api/applications/:id
  update: async (id, applicationData) => {
    try {
      const res = await api.put(`/applications/${id}`, applicationData);
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  // DELETE /api/applications/:id
  delete: async (id) => {
    try {
      const res = await api.delete(`/applications/${id}`);
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  // GET /api/applications/followups/upcoming?days=
  getUpcomingFollowUps: async (days = 7) => {
    try {
      const res = await api.get('/applications/followups/upcoming', { params: { days } });
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  // GET /api/applications/stats/summary
  getStatsSummary: async () => {
    try {
      const res = await api.get('/applications/stats/summary');
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },
};

export default applicationApi;
