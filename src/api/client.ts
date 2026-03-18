import axios from 'axios';
import { tokenStore, refreshTokenStore } from './token';

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach in-memory access token to every request
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Deduplicate concurrent refresh calls — only one in-flight at a time
let refreshPromise: Promise<string> | null = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const storedRefresh = refreshTokenStore.get();
    if (!storedRefresh) {
      tokenStore.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        // Use plain axios (not `client`) to avoid running through these interceptors again
        refreshPromise = axios
          .post<{ data: { accessToken: string; refreshToken: string } }>(
            '/api/auth/refresh',
            { refreshToken: storedRefresh },
          )
          .then(({ data }) => {
            const { accessToken, refreshToken } = data.data;
            tokenStore.set(accessToken);
            refreshTokenStore.set(refreshToken); // rotation — new token each use
            return accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return client(original);
    } catch {
      tokenStore.clear();
      refreshTokenStore.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }
  },
);

export default client;
