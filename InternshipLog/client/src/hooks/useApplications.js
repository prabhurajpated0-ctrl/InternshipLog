import { useState, useEffect, useCallback } from 'react';
import { applicationApi } from '../api/applicationApi';

export function useApplications() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [stageFilter, setStageFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, statsRes, followUpsRes] = await Promise.all([
        applicationApi.getAll({ stage: stageFilter, search: searchQuery }),
        applicationApi.getStatsSummary(),
        applicationApi.getUpcomingFollowUps(),
      ]);

      setApplications(appsRes.data || []);
      setStats(statsRes.data || null);
      setUpcomingFollowUps(followUpsRes.data || []);
    } catch (err) {
      setError(err.message || 'Error loading applications');
    } finally {
      setLoading(false);
    }
  }, [stageFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addApplication = async (data) => {
    const res = await applicationApi.create(data);
    await loadData();
    return res.data;
  };

  const updateApplication = async (id, data) => {
    const res = await applicationApi.update(id, data);
    await loadData();
    return res.data;
  };

  const deleteApplication = async (id) => {
    await applicationApi.delete(id);
    await loadData();
  };

  return {
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
    refresh: loadData,
  };
}
