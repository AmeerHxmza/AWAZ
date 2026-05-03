import axios from 'axios';
import { getToken, clearToken } from './auth';

function normalizeApiBaseUrl(raw: string | undefined): string {
  if (!raw || typeof raw !== 'string') {
    return 'http://localhost:8000';
  }
  let u = raw.trim();
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) {
    u = u.slice(1, -1).trim();
  }
  u = u.replace(/;+\s*$/, '').trim();
  u = u.replace(/\/+$/, '');
  return u || 'http://localhost:8000';
}

/** Normalized API origin (no trailing slash). Use for axios and iframe URLs. */
export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
