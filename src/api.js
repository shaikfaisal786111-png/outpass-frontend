import axios from 'axios';

const defaultApiUrl = import.meta.env.PROD
  ? 'https://outpass-backend-7ssu.onrender.com'
  : 'http://localhost:5000';

// Vercel uses VITE_API_BASE_URL; local development works without an .env file.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiUrl });

const tokenKey = (role) => `${role.toLowerCase()}_token`;
export const getToken = (role) => role ? localStorage.getItem(tokenKey(role)) : null;
export const setToken = (role, token) => {
  if (token) localStorage.setItem(tokenKey(role), token);
  else localStorage.removeItem(tokenKey(role));
  // Clean up the legacy shared token so it cannot authorize the wrong portal.
  localStorage.removeItem('outpass_session');
};

api.interceptors.request.use((config) => {
  const role = window.location.pathname.startsWith('/guard') ? 'GUARD' : window.location.pathname.startsWith('/mentor') ? 'MENTOR' : 'HOD';
  const token = getToken(role);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
