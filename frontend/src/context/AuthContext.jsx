import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('campuseats_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('campuseats_token') || null);
  const [dailyUsage, setDailyUsage] = useState({
    spent_today: 0,
    calories_today: 0,
    daily_budget: 300,
    daily_calorie_limit: 1800,
    remaining_budget: 300,
    remaining_calories: 1800
  });
  const [loading, setLoading] = useState(true);

  // Fetch current user and daily usage on mount if token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [meRes, usageRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/auth/daily-usage').catch(() => null)
        ]);

        if (meRes.data.success) {
          setUser(meRes.data.user);
          localStorage.setItem('campuseats_user', JSON.stringify(meRes.data.user));
        }
        if (usageRes && usageRes.data.success) {
          setDailyUsage(usageRes.data.data);
        }
      } catch (err) {
        console.error('Session validation error:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  // Refresh daily usage (called after orders, cart changes, or profile update)
  const refreshDailyUsage = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/daily-usage');
      if (res.data.success) {
        setDailyUsage(res.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh daily usage:', err);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('campuseats_token', newToken);
      localStorage.setItem('campuseats_user', JSON.stringify(newUser));
      await refreshDailyUsage();
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data.message };
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('campuseats_token', newToken);
      localStorage.setItem('campuseats_user', JSON.stringify(newUser));
      await refreshDailyUsage();
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('campuseats_token');
    localStorage.removeItem('campuseats_user');
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('campuseats_user', JSON.stringify(res.data.user));
      await refreshDailyUsage();
      return { success: true, message: res.data.message };
    }
    return { success: false, message: res.data.message };
  };

  const resetDailyCounters = async () => {
    try {
      const res = await api.post('/auth/reset-daily-usage');
      if (res.data.success) {
        setDailyUsage(res.data.data);
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      console.error('Reset counters failed:', err);
    }
    return { success: false, message: 'Failed to reset counters.' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        role: user ? user.role : null,
        loading,
        dailyUsage,
        refreshDailyUsage,
        resetDailyCounters,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);
