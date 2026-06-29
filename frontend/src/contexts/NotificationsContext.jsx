import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext({ leaves: 0, attendanceChanges: 0, rosterChanges: 0, refresh: () => {} });

const POLL_INTERVAL_MS = 30_000;

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ leaves: 0, attendanceChanges: 0, rosterChanges: 0 });
  const timerRef = useRef(null);

  const fetch = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications');
      if (res.success) setCounts(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!user) {
      setCounts({ leaves: 0, attendanceChanges: 0, rosterChanges: 0 });
      clearInterval(timerRef.current);
      return;
    }
    fetch();
    timerRef.current = setInterval(fetch, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [user, fetch]);

  return (
    <NotificationsContext.Provider value={{ ...counts, refresh: fetch }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
