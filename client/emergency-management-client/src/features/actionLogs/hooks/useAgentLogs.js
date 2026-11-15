import { useCallback, useRef, useState, useEffect } from 'react';
import api from '../../../services/api';

/**
 * פיד סוכן בדשבורד: ברירת מחדל רק החלטות חדשות מאז כניסה למסך (לא היסטוריה מה-DB).
 * אפשר להציג היסטוריה בלחיצה על כפתור.
 */
export const useAgentLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const sessionStartedAtRef = useRef(Date.now());

  const filterLogs = useCallback((data, includeHistory) => {
    const list = Array.isArray(data) ? data : [];
    if (includeHistory) {
      return list;
    }
    return list.filter(
      (log) => log?.timestamp && new Date(log.timestamp).getTime() >= sessionStartedAtRef.current
    );
  }, []);

  const fetchLogs = useCallback(
    async (includeHistory) => {
      const historyMode = includeHistory ?? showHistory;
      try {
        setLoading(true);
        const response = await api.get('/agent-logs');
        setLogs(filterLogs(response.data, historyMode));
        setError(null);
      } catch (err) {
        console.error('Error fetching agent logs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filterLogs, showHistory]
  );

  const toggleHistory = useCallback(() => {
    setShowHistory((prev) => {
      const next = !prev;
      fetchLogs(next);
      return next;
    });
  }, [fetchLogs]);

  // כניסה לדשבורד — פיד ריק, רק החלטות חדשות מהרגע הזה
  useEffect(() => {
    sessionStartedAtRef.current = Date.now();
    setLogs([]);
    setShowHistory(false);
    setError(null);
  }, []);

  useEffect(() => {
    fetchLogs(showHistory);
    const interval = setInterval(() => fetchLogs(showHistory), 5000);
    return () => clearInterval(interval);
  }, [showHistory, fetchLogs]);

  return {
    logs,
    loading,
    error,
    showHistory,
    toggleHistory,
    refreshLogs: () => fetchLogs(showHistory),
  };
};
