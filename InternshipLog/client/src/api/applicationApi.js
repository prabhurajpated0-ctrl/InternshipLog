const API_BASE = '/api/applications';

export const applicationApi = {
  // GET /api/applications (supports ?stage=, ?search=)
  getAll: async ({ stage, search } = {}) => {
    const params = new URLSearchParams();
    if (stage) params.append('stage', stage);
    if (search) params.append('search', search);

    const url = `${API_BASE}${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
  },

  // GET /api/applications/:id
  getById: async (id) => {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch application');
    return res.json();
  },

  // POST /api/applications
  create: async (data) => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create application');
    }
    return res.json();
  },

  // PUT /api/applications/:id
  update: async (id, data) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update application');
    }
    return res.json();
  },

  // DELETE /api/applications/:id
  delete: async (id) => {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete application');
    return res.json();
  },

  // GET /api/applications/followups/upcoming
  getUpcomingFollowUps: async () => {
    const res = await fetch(`${API_BASE}/followups/upcoming`);
    if (!res.ok) throw new Error('Failed to fetch upcoming follow-ups');
    return res.json();
  },

  // GET /api/applications/stats/summary
  getStatsSummary: async () => {
    const res = await fetch(`${API_BASE}/stats/summary`);
    if (!res.ok) throw new Error('Failed to fetch stats summary');
    return res.json();
  },
};
