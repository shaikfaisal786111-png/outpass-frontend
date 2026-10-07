import axios from 'axios';

const defaultApiUrl = import.meta.env.PROD
  ? 'https://outpass-backend-7ssu.onrender.com'
  : 'http://localhost:5000';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultApiUrl
});

const tokenKey = (role) => (role ? `${String(role).toLowerCase()}_token` : 'user_token');

export const getToken = (role) => (role ? localStorage.getItem(tokenKey(role)) : null);

export const setToken = (role, token) => {
  if (!role) return;
  if (token) {
    localStorage.setItem(tokenKey(role), token);
  } else {
    localStorage.removeItem(tokenKey(role));
  }
  localStorage.removeItem('outpass_session');
};

api.interceptors.request.use(
  (config) => {
    const path = window.location.pathname;
    const role = path.startsWith('/guard')
      ? 'GUARD'
      : path.startsWith('/mentor')
      ? 'MENTOR'
      : 'HOD';

    const token = getToken(role);
    if (token) {
      if (config.headers.set) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;