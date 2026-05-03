"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../lib/types';
import { getToken, decodeToken, clearToken, setToken } from '../lib/auth';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  role: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const applyToken = useCallback((token: string) => {
    setToken(token);
    const decoded = decodeToken(token);
    const r = typeof decoded?.role === 'string' ? decoded.role : null;
    setRole(r);
    const uid = decoded?.user_id;
    const email = typeof decoded?.email === 'string' ? decoded.email : '';
    setUser({
      id: typeof uid === 'number' ? uid : Number(uid) || 0,
      email,
      role: (r as User['role']) || 'user',
      full_name: '',
      is_active: true,
      created_at: '',
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setRole(null);
      return;
    }
    try {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
      setRole(data.role);
    } catch {
      clearToken();
      setUser(null);
      setRole(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const token = getToken();
      if (!token) {
        setUser(null);
        setRole(null);
        setIsLoading(false);
        return;
      }
      applyToken(token);
      try {
        const { data } = await api.get<User>('/auth/me');
        if (!cancelled) {
          setUser(data);
          setRole(data.role);
        }
      } catch {
        if (!cancelled) {
          clearToken();
          setUser(null);
          setRole(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [applyToken]);

  const login = (token: string) => {
    applyToken(token);
    void refreshUser();
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setRole(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
