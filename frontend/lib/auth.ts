import { decodeJwtPayload } from './jwtPayload';

const TOKEN_KEY = 'token';
/** Match backend default ACCESS_TOKEN_EXPIRE_MINUTES=1440 */
const MAX_AGE_SEC = 60 * 60 * 24;

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax`;
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  }
};

export const decodeToken = (token: string) => {
  return decodeJwtPayload(token);
};
