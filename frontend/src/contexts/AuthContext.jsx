import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const idleTimer = useRef(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem('attendix_token');
    localStorage.removeItem('attendix_user');
    setUser(null);
  }, []);

  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      clearSession();
    }, IDLE_TIMEOUT_MS);
  }, [clearSession]);

  useEffect(() => {
    // Check initial cached user payload
    const storedUser = localStorage.getItem('attendix_user');
    const storedToken = localStorage.getItem('attendix_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Event listener for interceptor logouts (401/403)
    const handleLogout = () => {
      clearSession();
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, []);

  // Start/stop idle timer based on login state
  useEffect(() => {
    if (!user) {
      clearTimeout(idleTimer.current);
      return;
    }

    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, resetIdleTimer));
      clearTimeout(idleTimer.current);
    };
  }, [user, resetIdleTimer]);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.success) {
        const { token, user: userPayload } = response.data;
        localStorage.setItem('attendix_token', token);
        localStorage.setItem('attendix_user', JSON.stringify(userPayload));
        setUser(userPayload);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Connecting to server failed' };
    }
  };

  const logout = () => {
    clearTimeout(idleTimer.current);
    clearSession();
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
