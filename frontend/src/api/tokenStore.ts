const ACCESS_KEY = 'tm.access';
const REFRESH_KEY = 'tm.refresh';

function safeStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export const tokenStore = {
  set(access?: string, refresh?: string) {
    const s = safeStorage();
    if (!s) return;
    if (access) s.setItem(ACCESS_KEY, access);
    if (refresh) s.setItem(REFRESH_KEY, refresh);
  },
  getAccess(): string | null {
    return safeStorage()?.getItem(ACCESS_KEY) ?? null;
  },
  getRefresh(): string | null {
    return safeStorage()?.getItem(REFRESH_KEY) ?? null;
  },
  clear() {
    const s = safeStorage();
    if (!s) return;
    s.removeItem(ACCESS_KEY);
    s.removeItem(REFRESH_KEY);
  },
};
