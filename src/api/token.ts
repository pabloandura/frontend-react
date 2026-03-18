/**
 * Module-level token store.
 *
 * Access token lives in memory only — never persisted to storage, so it
 * cannot be read by XSS-injected scripts that scan localStorage/sessionStorage.
 *
 * Refresh token lives in localStorage so sessions survive page refreshes and
 * new tabs, but it is rotated on every use (see refresh-token.use-case.ts).
 */

let _accessToken: string | null = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token: string) => { _accessToken = token; },
  clear: () => { _accessToken = null; },
};

const REFRESH_KEY = 'rt';

export const refreshTokenStore = {
  get: () => localStorage.getItem(REFRESH_KEY),
  set: (token: string) => localStorage.setItem(REFRESH_KEY, token),
  clear: () => localStorage.removeItem(REFRESH_KEY),
};
