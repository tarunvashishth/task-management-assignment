import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from './tokenStore';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const access = tokenStore.getAccess();
  if (access && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

let refreshInFlight: Promise<string | null> | null = null;

async function attemptRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;

  refreshInFlight = (async () => {
    try {
      const res = await axios.post<{ accessToken?: string; refreshToken?: string }>(
        `${import.meta.env.VITE_API_URL || ''}/auth/refresh`,
        { refreshToken: refresh },
        { withCredentials: true },
      );
      tokenStore.set(res.data.accessToken, res.data.refreshToken);
      return res.data.accessToken ?? null;
    } catch {
      tokenStore.clear();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = err.response?.status;
    const url: string = original?.url ?? '';
    const isAuthCheck = url.includes('/auth/me');
    const isRefreshCall = url.includes('/auth/refresh');
    const isLoginCall = url.includes('/auth/login') || url.includes('/auth/register');
    const isAuthPage =
      window.location.pathname.includes('/login') || window.location.pathname.includes('/register');

    if (status === 401 && original && !original._retry && !isRefreshCall && !isLoginCall) {
      original._retry = true;
      const newAccess = await attemptRefresh();
      if (newAccess) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        return client.request(original);
      }
    }

    if (status === 401 && !isAuthCheck && !isAuthPage && !isRefreshCall) {
      tokenStore.clear();
      window.location.href = '/login';
    }

    return Promise.reject(err);
  },
);

export default client;
