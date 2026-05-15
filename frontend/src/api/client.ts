import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCheck = err.config?.url?.includes('/auth/me');
    const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
    if (err.response?.status === 401 && !isAuthCheck && !isAuthPage) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default client;
